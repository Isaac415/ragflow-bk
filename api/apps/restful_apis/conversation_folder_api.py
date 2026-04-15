#
#  Copyright 2024 The InfiniFlow Authors. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

import logging

from quart import request

from api.apps import current_user, login_required
from api.db.db_models import Conversation, API4Conversation
from api.db.services.canvas_service import UserCanvasService, API4ConversationService
from api.db.services.conversation_folder_service import ConversationFolderService
from api.db.services.conversation_service import ConversationService
from api.db.services.dialog_service import DialogService
from api.utils.api_utils import (
    get_data_error_result,
    get_json_result,
    get_request_json,
    server_error_response,
)
from common.constants import RetCode, StatusEnum
from common.misc_utils import get_uuid


def _verify_parent_ownership(parent_id, source):
    if source == "chat":
        return bool(DialogService.query(
            tenant_id=current_user.id, id=parent_id, status=StatusEnum.VALID.value
        ))
    elif source == "agent":
        return UserCanvasService.accessible(parent_id, current_user.id)
    return False


@manager.route('/conversation_folders', methods=['POST'])  # noqa: F821
@login_required
async def create_folder():
    try:
        req = await get_request_json()
        parent_id = req.get("parent_id")
        source = req.get("source")
        name = req.get("name", "").strip()

        if not parent_id:
            return get_data_error_result(message="`parent_id` is required.")
        if source not in ("chat", "agent"):
            return get_data_error_result(message="`source` must be 'chat' or 'agent'.")
        if not name:
            return get_data_error_result(message="`name` is required.")
        if len(name.encode("utf-8")) > 255:
            return get_data_error_result(message="Folder name is too long (max 255 bytes).")

        if not _verify_parent_ownership(parent_id, source):
            return get_json_result(
                data=False, message="No authorization.", code=RetCode.AUTHENTICATION_ERROR
            )

        folder = {
            "id": get_uuid(),
            "user_id": current_user.id,
            "parent_id": parent_id,
            "source": source,
            "name": name,
        }
        ConversationFolderService.save(**folder)
        return get_json_result(data=folder)
    except Exception as ex:
        return server_error_response(ex)


@manager.route('/conversation_folders', methods=['GET'])  # noqa: F821
@login_required
def list_folders():
    try:
        parent_id = request.args.get("parent_id")
        source = request.args.get("source")

        if not parent_id:
            return get_data_error_result(message="`parent_id` is required.")
        if source not in ("chat", "agent"):
            return get_data_error_result(message="`source` must be 'chat' or 'agent'.")

        folders = ConversationFolderService.get_list(parent_id, source, current_user.id)
        return get_json_result(data=folders)
    except Exception as ex:
        return server_error_response(ex)


@manager.route('/conversation_folders/<folder_id>', methods=['PUT'])  # noqa: F821
@login_required
async def update_folder(folder_id):
    try:
        req = await get_request_json()
        ok, folder = ConversationFolderService.get_by_id(folder_id)
        if not ok:
            return get_data_error_result(message="Folder not found.")
        if folder.user_id != current_user.id:
            return get_json_result(
                data=False, message="No authorization.", code=RetCode.AUTHENTICATION_ERROR
            )

        name = req.get("name", "").strip()
        if not name:
            return get_data_error_result(message="`name` is required.")
        if len(name.encode("utf-8")) > 255:
            return get_data_error_result(message="Folder name is too long (max 255 bytes).")

        ConversationFolderService.update_by_id(folder_id, {"name": name})
        ok, updated = ConversationFolderService.get_by_id(folder_id)
        return get_json_result(data=updated.to_dict())
    except Exception as ex:
        return server_error_response(ex)


@manager.route('/conversation_folders/<folder_id>', methods=['DELETE'])  # noqa: F821
@login_required
def delete_folder(folder_id):
    try:
        ok, folder = ConversationFolderService.get_by_id(folder_id)
        if not ok:
            return get_data_error_result(message="Folder not found.")
        if folder.user_id != current_user.id:
            return get_json_result(
                data=False, message="No authorization.", code=RetCode.AUTHENTICATION_ERROR
            )

        # Unfile all sessions in this folder
        if folder.source == "chat":
            ConversationService.filter_update(
                [Conversation.folder_id == folder_id], {"folder_id": None}
            )
        elif folder.source == "agent":
            API4ConversationService.filter_update(
                [API4Conversation.folder_id == folder_id], {"folder_id": None}
            )

        ConversationFolderService.delete_by_id(folder_id)
        return get_json_result(data=True)
    except Exception as ex:
        return server_error_response(ex)


@manager.route('/conversation_folders/unfile', methods=['PUT'])  # noqa: F821
@login_required
async def unfile_sessions():
    try:
        req = await get_request_json()
        session_ids = req.get("session_ids", [])
        source = req.get("source")

        if not session_ids:
            return get_data_error_result(message="`session_ids` is required.")
        if source not in ("chat", "agent"):
            return get_data_error_result(message="`source` must be 'chat' or 'agent'.")

        if source == "chat":
            ConversationService.filter_update(
                [Conversation.id.in_(session_ids)], {"folder_id": None}
            )
        elif source == "agent":
            API4ConversationService.filter_update(
                [API4Conversation.id.in_(session_ids)], {"folder_id": None}
            )

        return get_json_result(data=True)
    except Exception as ex:
        return server_error_response(ex)


@manager.route('/conversation_folders/<folder_id>/sessions', methods=['PUT'])  # noqa: F821
@login_required
async def move_sessions_to_folder(folder_id):
    try:
        req = await get_request_json()
        session_ids = req.get("session_ids", [])

        if not session_ids:
            return get_data_error_result(message="`session_ids` is required.")

        ok, folder = ConversationFolderService.get_by_id(folder_id)
        if not ok:
            return get_data_error_result(message="Folder not found.")
        if folder.user_id != current_user.id:
            return get_json_result(
                data=False, message="No authorization.", code=RetCode.AUTHENTICATION_ERROR
            )

        if folder.source == "chat":
            ConversationService.filter_update(
                [Conversation.id.in_(session_ids), Conversation.dialog_id == folder.parent_id],
                {"folder_id": folder_id}
            )
        elif folder.source == "agent":
            API4ConversationService.filter_update(
                [API4Conversation.id.in_(session_ids), API4Conversation.dialog_id == folder.parent_id],
                {"folder_id": folder_id}
            )

        return get_json_result(data=True)
    except Exception as ex:
        return server_error_response(ex)
