import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from dotenv import load_dotenv
load_dotenv()

# This is the path to your 'backend' directory.
# We need to add the parent directory (FunTrip) to the Python path
# so that 'app.database' and 'app.models' can be imported.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
# Ensure the backend's 'app' directory is also in the path for direct imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


# Import your Base and models here
from app.database import Base, engine # Import engine too for direct bind
from app.models import user, trip, attraction, itinerary # Import all your models here


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import Base
# target_metadata = Base.metadata
target_metadata = Base.metadata # Crucial: Tell Alembic where your models' metadata is


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is preferable
    used with a database when available.

    By skipping the Engine creation we don't even need a DBAPI to be
    available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # Use the environment variable here for offline migrations
    url = os.getenv("DATABASE_URL")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # For online mode, use the engine directly from your app.database
    # instead of recreating it from alembic.ini config
    connectable = engine 
    # Or, if you want to use the config from alembic.ini for the DB URL:
    # connectable = engine_from_config(
    #     config.get_section(config.config_ini_section, {}),
    #     prefix="sqlalchemy.",
    #     poolclass=pool.NullPool,
    # )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # This is important for autogenerate to correctly detect column renames.
            # You might need to add other render_as_batch parameters if you're
            # dealing with specific database backends or complex operations.
            render_as_batch=True # Recommended for SQLite and other DBs for DDL operations
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()