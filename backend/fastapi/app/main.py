from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.scheduling import router as scheduling_router

app = FastAPI(title="BUSS-DASH Scheduling Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


app.include_router(scheduling_router)
