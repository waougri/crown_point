from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.gatekeeper.gatekeeper import gatekeeper_router
load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://crownpointconsult.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(gatekeeper_router)

@app.get("/health", status_code=200)
def health():
    return {"status": "ok"}