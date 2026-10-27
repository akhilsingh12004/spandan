"""
Spandan AI - Unified AI Client Layer
Integrates xAI Grok (Primary), Google Gemini (Multimodal Vision & Generative AI),
OpenAI, and Groq.
Enables real blood test report analysis, document parameter extraction,
clinical reasoning, and contextual conversational Q&A without model training.
"""

import os
import json
import base64
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import httpx

# Search paths for .env
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent

def _load_env_file():
    """Simple robust .env loader without requiring extra dependencies."""
    for env_path in [BACKEND_DIR / ".env", PROJECT_ROOT / ".env"]:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ and v:
                                os.environ[k] = v
            except Exception as e:
                print(f"[AIClient] Could not read {env_path}: {e}")

_load_env_file()


def get_available_ai_key(custom_key: Optional[str] = None, provider: Optional[str] = None) -> Tuple[Optional[str], str]:
    """
    Resolves the active API key and provider.
    Priority: custom_key -> os.environ -> .env
    Auto-detection order: xAI (Grok) -> Gemini -> OpenAI -> Groq
    """
    _load_env_file()
    
    if custom_key and custom_key.strip():
        resolved_provider = provider.lower() if provider else (
            "xai" if custom_key.startswith("xai-") else
            "openai" if custom_key.startswith("sk-") else
            "gemini"
        )
        return custom_key.strip(), resolved_provider

    prov = (provider or "").lower()
    if prov in ["xai", "grok"]:
        key = os.environ.get("XAI_API_KEY") or os.environ.get("GROK_AI_API_KEY")
        if key and key.strip() and key.strip() != "your_xai_api_key_here":
            return key.strip(), "xai"

    if prov in ["gemini", "google"]:
        key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if key:
            return key.strip(), "gemini"

    if prov == "openai":
        key = os.environ.get("OPENAI_API_KEY")
        if key:
            return key.strip(), "openai"

    if prov == "groq":
        key = os.environ.get("GROQ_API_KEY")
        if key:
            return key.strip(), "groq"

    # Default auto-detection order: xAI (Grok) -> Gemini -> OpenAI -> Groq
    xai_key = os.environ.get("XAI_API_KEY") or os.environ.get("GROK_AI_API_KEY")
    if xai_key and xai_key.strip() and xai_key.strip() != "your_xai_api_key_here":
        return xai_key.strip(), "xai"

    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        return gemini_key.strip(), "gemini"

    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        return openai_key.strip(), "openai"

    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        return groq_key.strip(), "groq"

    return None, "local"


def clean_json_markdown(text: str) -> str:
    """Strips markdown code fences (```json ... ```) to safely parse JSON strings."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def call_gemini_api(
    prompt: str,
    system_instruction: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/png",
    api_key: Optional[str] = None,
    model: str = "gemini-2.5-flash",
    response_json: bool = False,
    timeout: float = 60.0,
) -> str:
    """
    Executes a Google Gemini REST API call with multimodal support.
    Falls back gracefully from gemini-2.5-flash to gemini-1.5-flash if needed.
    """
    if not api_key:
        raise ValueError("Missing Gemini API Key.")

    models_to_try = [model]
    if model != "gemini-1.5-flash":
        models_to_try.append("gemini-1.5-flash")
    if model != "gemini-2.0-flash":
        models_to_try.append("gemini-2.0-flash")

    last_error = None

    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        parts: List[Dict[str, Any]] = []

        if image_bytes:
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": b64_img,
                }
            })

        parts.append({"text": prompt})

        payload: Dict[str, Any] = {
            "contents": [{"parts": parts}]
        }

        if system_instruction:
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction}]
            }

        generation_config: Dict[str, Any] = {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
        }
        if response_json:
            generation_config["response_mime_type"] = "application/json"

        payload["generationConfig"] = generation_config

        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts_out = candidates[0].get("content", {}).get("parts", [])
                        if parts_out:
                            return parts_out[0].get("text", "")
                    return ""
                else:
                    err_msg = resp.text
                    last_error = f"Gemini ({m}) HTTP {resp.status_code}: {err_msg}"
                    # If 404 or model not found, try next model; otherwise raise
                    if resp.status_code in [404, 400] and ("not found" in err_msg.lower() or "unsupported" in err_msg.lower()):
                        continue
                    raise RuntimeError(last_error)
        except Exception as e:
            last_error = str(e)
            continue

    raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")


def call_openai_api(
    prompt: str,
    system_instruction: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/png",
    api_key: Optional[str] = None,
    model: str = "gpt-4o-mini",
    response_json: bool = False,
    timeout: float = 60.0,
) -> str:
    """Executes an OpenAI Chat Completions API call with optional Vision input."""
    if not api_key:
        raise ValueError("Missing OpenAI API Key.")

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})

    if image_bytes:
        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        user_content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_img}"}}
        ]
        messages.append({"role": "user", "content": user_content})
    else:
        messages.append({"role": "user", "content": prompt})

    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
    }
    if response_json:
        payload["response_format"] = {"type": "json_object"}

    with httpx.Client(timeout=timeout) as client:
        resp = client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "")
            return ""
        raise RuntimeError(f"OpenAI HTTP {resp.status_code}: {resp.text}")


def call_groq_api(
    prompt: str,
    system_instruction: Optional[str] = None,
    api_key: Optional[str] = None,
    model: str = "llama-3.3-70b-versatile",
    response_json: bool = False,
    timeout: float = 45.0,
) -> str:
    """Executes a Groq Cloud LLM API call for text generation and structured extraction."""
    if not api_key:
        raise ValueError("Missing Groq API Key.")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
    }
    if response_json:
        payload["response_format"] = {"type": "json_object"}

    with httpx.Client(timeout=timeout) as client:
        resp = client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "")
            return ""
        raise RuntimeError(f"Groq HTTP {resp.status_code}: {resp.text}")


def call_xai_api(
    prompt: str,
    system_instruction: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/png",
    api_key: Optional[str] = None,
    model: str = "grok-3-latest",
    response_json: bool = False,
    timeout: float = 60.0,
) -> str:
    """
    Executes an xAI Grok API call via its OpenAI-compatible chat completions endpoint.
    Uses grok-3-latest as the default model for heart disease diagnosis.
    Supports multimodal (vision) inputs for ECG image analysis.
    """
    if not api_key:
        raise ValueError("Missing xAI (Grok) API Key. Set XAI_API_KEY in your .env file.")

    url = "https://api.x.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})

    if image_bytes:
        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        user_content = [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_img}"}}
        ]
        messages.append({"role": "user", "content": user_content})
    else:
        messages.append({"role": "user", "content": prompt})

    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
    }
    if response_json:
        payload["response_format"] = {"type": "json_object"}

    # Try primary model, then fallback
    models_to_try = [model]
    if model != "grok-2-latest":
        models_to_try.append("grok-2-latest")

    last_error = None
    for m in models_to_try:
        payload["model"] = m
        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
                    return ""
                else:
                    err_msg = resp.text
                    last_error = f"xAI Grok ({m}) HTTP {resp.status_code}: {err_msg}"
                    # If model not found, try next; otherwise raise
                    if resp.status_code in [404, 400] and ("not found" in err_msg.lower() or "unsupported" in err_msg.lower() or "invalid" in err_msg.lower()):
                        continue
                    raise RuntimeError(last_error)
        except RuntimeError:
            raise
        except Exception as e:
            last_error = str(e)
            continue

    raise RuntimeError(f"All xAI Grok models failed. Last error: {last_error}")


def execute_ai_query(
    prompt: str,
    system_instruction: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/png",
    api_key: Optional[str] = None,
    provider: Optional[str] = None,
    response_json: bool = False,
) -> Tuple[str, str, str]:
    """
    Unified entry point for AI queries.
    Returns (response_text, provider_used, model_used).
    Priority: xAI (Grok) -> Gemini -> OpenAI -> Groq
    """
    key, prov = get_available_ai_key(api_key, provider)
    if not key:
        raise ValueError("No AI API key is configured. Please provide an xAI (Grok), Gemini, or OpenAI key.")

    if prov == "xai":
        model_name = "grok-3-latest"
        text = call_xai_api(
            prompt=prompt,
            system_instruction=system_instruction,
            image_bytes=image_bytes,
            mime_type=mime_type,
            api_key=key,
            model=model_name,
            response_json=response_json,
        )
        return text, "xai", model_name

    elif prov == "gemini":
        model_name = "gemini-2.5-flash"
        text = call_gemini_api(
            prompt=prompt,
            system_instruction=system_instruction,
            image_bytes=image_bytes,
            mime_type=mime_type,
            api_key=key,
            model=model_name,
            response_json=response_json,
        )
        return text, "gemini", model_name

    elif prov == "openai":
        model_name = "gpt-4o-mini"
        text = call_openai_api(
            prompt=prompt,
            system_instruction=system_instruction,
            image_bytes=image_bytes,
            mime_type=mime_type,
            api_key=key,
            model=model_name,
            response_json=response_json,
        )
        return text, "openai", model_name

    elif prov == "groq":
        model_name = "llama-3.3-70b-versatile"
        text = call_groq_api(
            prompt=prompt,
            system_instruction=system_instruction,
            api_key=key,
            model=model_name,
            response_json=response_json,
        )
        return text, "groq", model_name

    raise ValueError(f"Unsupported AI provider: {prov}")


def test_ai_connection(api_key: str, provider: str = "xai") -> Dict[str, Any]:
    """Tests if the supplied API key is valid and can generate responses."""
    prov = provider.lower()
    try:
        if prov in ["xai", "grok"]:
            resp = call_xai_api(
                prompt="Respond in exactly one word: 'CONNECTED'",
                api_key=api_key,
                model="grok-3-latest",
                timeout=15.0
            )
            return {
                "success": True,
                "provider": "xai",
                "model": "grok-3-latest",
                "message": "Successfully connected to xAI Grok API.",
                "sampleResponse": resp.strip()
            }
        elif prov == "gemini":
            resp = call_gemini_api(
                prompt="Respond in exactly one word: 'CONNECTED'",
                api_key=api_key,
                model="gemini-2.5-flash",
                timeout=12.0
            )
            return {
                "success": True,
                "provider": "gemini",
                "model": "gemini-2.5-flash",
                "message": "Successfully connected to Google Gemini AI API.",
                "sampleResponse": resp.strip()
            }
        elif prov == "openai":
            resp = call_openai_api(
                prompt="Respond in exactly one word: 'CONNECTED'",
                api_key=api_key,
                model="gpt-4o-mini",
                timeout=12.0
            )
            return {
                "success": True,
                "provider": "openai",
                "model": "gpt-4o-mini",
                "message": "Successfully connected to OpenAI API.",
                "sampleResponse": resp.strip()
            }
        elif prov == "groq":
            resp = call_groq_api(
                prompt="Respond in exactly one word: 'CONNECTED'",
                api_key=api_key,
                model="llama-3.3-70b-versatile",
                timeout=12.0
            )
            return {
                "success": True,
                "provider": "groq",
                "model": "llama-3.3-70b-versatile",
                "message": "Successfully connected to Groq API.",
                "sampleResponse": resp.strip()
            }
        else:
            return {"success": False, "message": f"Unknown provider: {provider}"}
    except Exception as e:
        return {
            "success": False,
            "provider": provider,
            "error": str(e),
            "message": f"Connection test failed: {str(e)}"
        }


def save_key_to_env(api_key: str, provider: str = "xai") -> bool:
    """Persists the API key into backend/.env for server-side persistence."""
    env_file = BACKEND_DIR / ".env"
    key_var_map = {
        "xai": "XAI_API_KEY",
        "grok": "XAI_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "google": "GEMINI_API_KEY",
        "openai": "OPENAI_API_KEY",
        "groq": "GROQ_API_KEY",
    }
    var_name = key_var_map.get(provider.lower(), "XAI_API_KEY")

    existing_lines = []
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            existing_lines = f.readlines()

    updated = False
    new_lines = []
    for line in existing_lines:
        if line.strip().startswith(f"{var_name}="):
            new_lines.append(f"{var_name}={api_key.strip()}\n")
            updated = True
        else:
            new_lines.append(line)

    if not updated:
        new_lines.append(f"{var_name}={api_key.strip()}\n")

    with open(env_file, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    os.environ[var_name] = api_key.strip()
    return True
