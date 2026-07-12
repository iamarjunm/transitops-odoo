from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth

app = FastAPI(title="TransitOps API")

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


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "TransitOps API", "docs": "/docs"}
