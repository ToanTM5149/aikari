import logging
from sqlmodel import Session, create_engine, select
from sqlalchemy.pool import QueuePool
from sqlalchemy import event
from sqlalchemy.exc import DisconnectionError

from app.crud.crud import create_user
from app.core.config import settings
from app.models import User, UserRole
from app.schemas import UserCreate

logger = logging.getLogger(__name__)

engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600, 
    connect_args={
        "connect_timeout": 10,
        "sslmode": "prefer", 
    },
    echo=False,
)

# Event listener để log connection errors
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    logger.debug("Database connection established")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    logger.debug("Connection checked out from pool")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    logger.debug("Connection returned to pool")


def init_db(session: Session) -> None:

  user = session.exec(
    select(User).where(User.email == settings.FIRST_SUPERUSER)
  ).first()
  if not user:
    # Create superuser with Admin role
    user_in = UserCreate(
      username="admin",
      email=settings.FIRST_SUPERUSER,
      password=settings.FIRST_SUPERUSER_PASSWORD,
      full_name="Administrator",
      role=UserRole.ADMIN,
    )
    user = create_user(session=session, user_create=user_in)
