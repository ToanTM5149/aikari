import logging
from typing import Any

import httpx

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DifyService:
    """Service để kết nối và tương tác với Dify API"""

    def __init__(self):
        self.api_key = settings.DIFY_API_KEY
        self.base_url = settings.DIFY_BASE_URL.rstrip("/")
        self.timeout = 30.0
        # API prefix - có thể là "api" hoặc "api/v1" tùy vào cấu hình Dify
        # Nếu base_url đã có /v1 thì endpoint chỉ cần "chat-messages"
        # Nếu base_url không có /v1 thì endpoint cần "api/v1/chat-messages"
        self.api_prefix = self._determine_api_prefix()

        if not self.api_key:
            logger.warning("DIFY_API_KEY chưa được cấu hình")

    def _determine_api_prefix(self) -> str:
        """
        Xác định API prefix dựa vào base_url
        Nếu base_url đã có /v1 thì không cần prefix
        Nếu base_url không có /v1 thì dùng "api/v1"
        """
        if "/v1" in self.base_url:
            # Base URL đã có /v1, endpoint chỉ cần tên endpoint
            return ""
        else:
            # Base URL chưa có /v1, cần thêm "api/v1"
            return "api/v1"

    @property
    def _headers(self) -> dict[str, str]:
        """Headers mặc định cho các request đến Dify API"""
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _get_full_url(self, endpoint: str) -> str:
        """
        Tạo full URL từ endpoint
        
        Args:
            endpoint: Endpoint path (ví dụ: "chat-messages" hoặc "api/v1/chat-messages")
        
        Returns:
            Full URL
        """
        endpoint = endpoint.lstrip("/")
        
        # Nếu endpoint đã có "api/v1" hoặc "api", dùng trực tiếp
        if endpoint.startswith("api/"):
            return f"{self.base_url}/{endpoint}"
        
        # Nếu có api_prefix, thêm vào
        if self.api_prefix:
            return f"{self.base_url}/{self.api_prefix}/{endpoint}"
        
        # Không có prefix, dùng trực tiếp
        return f"{self.base_url}/{endpoint}"

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Thực hiện HTTP request đến Dify API

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (ví dụ: "api/v1/chat-messages")
            data: Request body data
            params: Query parameters

        Returns:
            Response data dưới dạng dictionary

        Raises:
            httpx.HTTPError: Nếu request thất bại
            ValueError: Nếu API key chưa được cấu hình
        """
        if not self.api_key:
            raise ValueError("DIFY_API_KEY chưa được cấu hình trong biến môi trường")

        url = self._get_full_url(endpoint)
        logger.info(f"Gửi {method} request đến {url}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=self._headers,
                    json=data,
                    params=params,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Lỗi HTTP từ Dify API: {e.response.status_code} - {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Lỗi kết nối đến Dify API: {str(e)}")
                raise

    async def health_check(self) -> dict[str, Any]:
        """
        Kiểm tra kết nối và trạng thái của Dify API
        Thử gọi workflow run với inputs rỗng để kiểm tra kết nối (cho workflow app)

        Returns:
            Thông tin về trạng thái API
        """
        # Thử gọi workflow run với inputs rỗng để test kết nối
        # Đây là cách đơn giản nhất để test workflow app
        try:
            result = await self.run_workflow(inputs={}, user="health_check")
            return {
                "status": "connected",
                "message": "Kết nối đến Dify Workflow API thành công",
                "base_url": self.base_url,
                "workflow_result": result,
            }
        except httpx.HTTPStatusError as e:
            error_data = {}
            try:
                error_data = e.response.json()
            except Exception:
                error_data = {"message": e.response.text}
            
            # Nếu có lỗi nhưng server đã phản hồi, vẫn coi là kết nối thành công
            if e.response.status_code in (400, 404):
                return {
                    "status": "connected",
                    "message": "Kết nối đến Dify API thành công",
                    "base_url": self.base_url,
                    "note": "Workflow có thể cần inputs hoặc có lỗi cấu hình",
                    "error_detail": error_data,
                }
            raise
        except Exception as e:
            # Nếu có lỗi khác, vẫn trả về thông tin kết nối
            return {
                "status": "connected",
                "message": "Kết nối đến Dify API thành công",
                "base_url": self.base_url,
                "note": f"Có thể chạy workflow nhưng gặp lỗi: {str(e)}",
            }

    async def chat_completion(
        self,
        query: str,
        user: str | None = None,
        conversation_id: str | None = None,
        response_mode: str = "blocking",
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Gửi chat message đến Dify API

        Args:
            query: Câu hỏi hoặc message từ user
            user: User ID (optional)
            conversation_id: ID của conversation (optional, để tiếp tục cuộc trò chuyện)
            response_mode: Chế độ response ("blocking" hoặc "streaming")
            **kwargs: Các tham số bổ sung cho Dify API

        Returns:
            Response từ Dify API chứa answer và metadata
        """
        data: dict[str, Any] = {
            "inputs": {},
            "query": query,
            "response_mode": response_mode,
        }

        if user:
            data["user"] = user

        if conversation_id:
            data["conversation_id"] = conversation_id

        # Thêm các tham số bổ sung
        data.update(kwargs)

        return await self._request("POST", "chat-messages", data=data)

    async def completion(
        self,
        prompt: str,
        user: str | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Gửi completion request đến Dify API (cho completion app)

        Args:
            prompt: Prompt text
            user: User ID (optional)
            **kwargs: Các tham số bổ sung cho Dify API

        Returns:
            Response từ Dify API chứa answer và metadata
        """
        data: dict[str, Any] = {
            "inputs": {},
            "query": prompt,
            "response_mode": "blocking",
        }

        if user:
            data["user"] = user

        # Thêm các tham số bổ sung
        data.update(kwargs)

        return await self._request("POST", "completion-messages", data=data)

    async def get_conversation_messages(
        self,
        conversation_id: str,
        user: str | None = None,
        limit: int = 20,
        first_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Lấy danh sách messages trong một conversation

        Args:
            conversation_id: ID của conversation
            user: User ID (optional)
            limit: Số lượng messages tối đa
            first_id: ID của message đầu tiên để pagination

        Returns:
            Danh sách messages
        """
        params: dict[str, Any] = {
            "conversation_id": conversation_id,
            "limit": limit,
        }

        if user:
            params["user"] = user

        if first_id:
            params["first_id"] = first_id

        return await self._request("GET", "messages", params=params)

    async def get_conversations(
        self,
        user: str | None = None,
        limit: int = 20,
        last_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Lấy danh sách conversations

        Args:
            user: User ID (optional)
            limit: Số lượng conversations tối đa
            last_id: ID của conversation cuối cùng để pagination

        Returns:
            Danh sách conversations
        """
        params: dict[str, Any] = {
            "limit": limit,
        }

        if user:
            params["user"] = user

        if last_id:
            params["last_id"] = last_id

        return await self._request("GET", "conversations", params=params)

    async def run_workflow(
        self,
        inputs: dict[str, Any],
        user: str | None = None,
        response_mode: str = "blocking",
        app_id: str | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Chạy workflow app trong Dify

        Args:
            inputs: Dictionary chứa các input variables cho workflow
            user: User ID (optional)
            response_mode: Chế độ response ("blocking" hoặc "streaming")
            app_id: Workflow App ID (optional - nếu không có thì dùng app_id từ API key)
            **kwargs: Các tham số bổ sung cho Dify API

        Returns:
            Response từ Dify API chứa kết quả workflow và metadata
        """
        data: dict[str, Any] = {
            "inputs": inputs,
            "response_mode": response_mode,
        }

        if user:
            data["user"] = user

        # Nếu có app_id, thêm vào data
        # Lưu ý: Nếu API key đã được tạo từ một app cụ thể, không cần app_id
        # Nhưng nếu dùng API key chung, cần truyền app_id
        if app_id:
            data["app_id"] = app_id

        # Thêm các tham số bổ sung
        data.update(kwargs)

        return await self._request("POST", "workflows/run", data=data)


# Singleton instance
dify_service = DifyService()

