from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentUser
from app.schemas import Message
from app.services import dify_service

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatRequest(BaseModel):
    query: str
    user: str | None = None
    conversation_id: str | None = None
    response_mode: str = "blocking"


class CompletionRequest(BaseModel):
    prompt: str
    user: str | None = None


class ChatResponse(BaseModel):
    answer: str
    conversation_id: str | None = None
    message_id: str | None = None
    metadata: dict | None = None


class CompletionResponse(BaseModel):
    answer: str
    message_id: str | None = None
    metadata: dict | None = None


class WorkflowRequest(BaseModel):
    inputs: dict = {}
    user: str | None = None
    response_mode: str = "blocking"


class WorkflowResponse(BaseModel):
    task_id: str | None = None
    workflow_run_id: str | None = None
    status: str | None = None
    outputs: dict | None = None
    data: dict | None = None


@router.get("/health-check/")
async def dify_health_check() -> dict:
    """
    Kiểm tra kết nối đến Dify API
    Chỉ dùng cho testing, không cần authentication
    """
    try:
        result = await dify_service.health_check()
        return {
            "status": "success",
            "message": "Kết nối Dify API thành công",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cấu hình Dify chưa đầy đủ: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi kết nối Dify API: {str(e)}",
        )


@router.post("/chat/", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    current_user: CurrentUser,
) -> ChatResponse:
    """
    Gửi chat message đến Dify AI

    Args:
        request: Chat request với query và các tham số
        current_user: User hiện tại (từ authentication)

    Returns:
        Response từ Dify AI
    """
    try:
        # Sử dụng user ID từ current_user nếu không có user trong request
        user_id = request.user or str(current_user.id)

        result = await dify_service.chat_completion(
            query=request.query,
            user=user_id,
            conversation_id=request.conversation_id,
            response_mode=request.response_mode,
        )

        # Parse response từ Dify API
        # Cấu trúc response có thể khác nhau tùy vào Dify version
        answer = result.get("answer", "")
        conversation_id = result.get("conversation_id")
        message_id = result.get("id")
        metadata = result.get("metadata")

        return ChatResponse(
            answer=answer,
            conversation_id=conversation_id,
            message_id=message_id,
            metadata=metadata,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cấu hình Dify chưa đầy đủ: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi gọi Dify API: {str(e)}",
        )


@router.post("/completion/", response_model=CompletionResponse)
async def completion(
    request: CompletionRequest,
    current_user: CurrentUser,
) -> CompletionResponse:
    """
    Gửi completion request đến Dify AI (cho completion app)

    Args:
        request: Completion request với prompt
        current_user: User hiện tại (từ authentication)

    Returns:
        Response từ Dify AI
    """
    try:
        # Sử dụng user ID từ current_user nếu không có user trong request
        user_id = request.user or str(current_user.id)

        result = await dify_service.completion(
            prompt=request.prompt,
            user=user_id,
        )

        # Parse response từ Dify API
        answer = result.get("answer", "")
        message_id = result.get("id")
        metadata = result.get("metadata")

        return CompletionResponse(
            answer=answer,
            message_id=message_id,
            metadata=metadata,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cấu hình Dify chưa đầy đủ: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi gọi Dify API: {str(e)}",
        )


@router.post("/workflow/run/", response_model=WorkflowResponse)
async def run_workflow(
    request: WorkflowRequest,
    current_user: CurrentUser,
) -> WorkflowResponse:
    """
    Chạy workflow app trong Dify

    Args:
        request: Workflow request với inputs và các tham số
        current_user: User hiện tại (từ authentication)

    Returns:
        Response từ Dify Workflow API
    """
    try:
        # Sử dụng user ID từ current_user nếu không có user trong request
        user_id = request.user or str(current_user.id)

        result = await dify_service.run_workflow(
            inputs=request.inputs,
            user=user_id,
            response_mode=request.response_mode,
        )

        # Parse response từ Dify Workflow API
        task_id = result.get("task_id")
        workflow_run_id = result.get("workflow_run_id")
        data = result.get("data", {})
        status = data.get("status") if data else result.get("status")
        outputs = data.get("outputs") if data else result.get("outputs")

        return WorkflowResponse(
            task_id=task_id,
            workflow_run_id=workflow_run_id,
            status=status,
            outputs=outputs,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cấu hình Dify chưa đầy đủ: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi chạy workflow: {str(e)}",
        )


@router.get("/conversations/")
async def get_conversations(
    current_user: CurrentUser,
    limit: int = 20,
    last_id: str | None = None,
) -> dict:
    """
    Lấy danh sách conversations của user hiện tại

    Args:
        limit: Số lượng conversations tối đa
        last_id: ID của conversation cuối cùng để pagination
        current_user: User hiện tại

    Returns:
        Danh sách conversations
    """
    try:
        user_id = str(current_user.id)
        result = await dify_service.get_conversations(
            user=user_id,
            limit=limit,
            last_id=last_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cấu hình Dify chưa đầy đủ: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy conversations: {str(e)}",
        )


@router.get("/conversations/{conversation_id}/messages/")
async def get_conversation_messages(
    conversation_id: str,
    current_user: CurrentUser,
    limit: int = 20,
    first_id: str | None = None,
) -> dict:
    """
    Lấy danh sách messages trong một conversation

    Args:
        conversation_id: ID của conversation
        limit: Số lượng messages tối đa
        first_id: ID của message đầu tiên để pagination
        current_user: User hiện tại

    Returns:
        Danh sách messages
    """
    try:
        user_id = str(current_user.id)
        result = await dify_service.get_conversation_messages(
            conversation_id=conversation_id,
            user=user_id,
            limit=limit,
            first_id=first_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cấu hình Dify chưa đầy đủ: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy messages: {str(e)}",
        )

