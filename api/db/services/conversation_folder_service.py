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
from api.db.db_models import ConversationFolder, DB
from api.db.services.common_service import CommonService


class ConversationFolderService(CommonService):
    model = ConversationFolder

    @classmethod
    @DB.connection_context()
    def get_list(cls, parent_id, source, user_id):
        folders = cls.model.select().where(
            cls.model.parent_id == parent_id,
            cls.model.source == source,
            cls.model.user_id == user_id
        ).order_by(cls.model.create_time.asc())
        return list(folders.dicts())
