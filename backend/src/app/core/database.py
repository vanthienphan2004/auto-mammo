from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.settings import settings

engine = create_async_engine(settings.database_url, echo=True)
local_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_database() -> AsyncGenerator[AsyncSession, None]:
    async with local_session() as session:
        yield session
