from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, vehicles, driver_management, dashboard, maintenance, expenses, trip_management
from contextlib import asynccontextmanager

from app.utils.reminder import start_scheduler, stop_scheduler

# app = FastAPI(title="TransitOps API")
@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="TransitOps API",
    lifespan=lifespan,
)

# Allow the local Next.js dev server and the deployed Vercel frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://transitops-odoo-mu.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(dashboard.router)
app.include_router(driver_management.router)
app.include_router(maintenance.router)
app.include_router(expenses.router)
app.include_router(trip_management.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "TransitOps API", "docs": "/docs"}
