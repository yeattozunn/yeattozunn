"""
Günlük parfüm ürün görseli üretip Instagram'da (@splitcimcom) paylaşan otomasyon.

Akış:
  1. OpenAI görsel üretim API'si ile parfüm ürün görseli üretilir.
  2. Görsel, herkese açık bir URL elde etmek için imgbb'ye yüklenir
     (Instagram Graph API görsel paylaşımı için herkese açık bir URL ister).
  3. Instagram Graph API ile medya konteyneri oluşturulur ve yayınlanır.

Gerekli ortam değişkenleri (GitHub Actions secrets olarak tanımlanır):
  OPENAI_API_KEY   - OpenAI API anahtarı
  IMGBB_API_KEY    - imgbb.com API anahtarı (ücretsiz hesap)
  IG_USER_ID       - Instagram Business hesabının Graph API kullanıcı ID'si
  IG_ACCESS_TOKEN  - Instagram Graph API için uzun ömürlü access token
"""

import base64
import datetime
import os
import random
import sys
import time

import requests
from openai import OpenAI

from prompts import CAPTION_TEMPLATES, PERFUME_PROMPTS

GRAPH_API_VERSION = "v21.0"


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        print(f"HATA: '{name}' ortam değişkeni tanımlı değil.", file=sys.stderr)
        sys.exit(1)
    return value


def pick_today_prompt() -> str:
    day_of_year = datetime.date.today().timetuple().tm_yday
    return PERFUME_PROMPTS[day_of_year % len(PERFUME_PROMPTS)]


def generate_image(openai_api_key: str, prompt: str) -> bytes:
    client = OpenAI(api_key=openai_api_key)
    result = client.images.generate(
        model="gpt-image-1",
        prompt=prompt,
        size="1024x1024",
    )
    image_b64 = result.data[0].b64_json
    return base64.b64decode(image_b64)


def upload_to_imgbb(imgbb_api_key: str, image_bytes: bytes) -> str:
    response = requests.post(
        "https://api.imgbb.com/1/upload",
        params={"key": imgbb_api_key},
        data={"image": base64.b64encode(image_bytes)},
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("success"):
        raise RuntimeError(f"imgbb yükleme başarısız: {payload}")
    return payload["data"]["url"]


def create_media_container(ig_user_id: str, access_token: str, image_url: str, caption: str) -> str:
    response = requests.post(
        f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_user_id}/media",
        data={
            "image_url": image_url,
            "caption": caption,
            "access_token": access_token,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["id"]


def publish_media(ig_user_id: str, access_token: str, creation_id: str) -> str:
    response = requests.post(
        f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_user_id}/media_publish",
        data={
            "creation_id": creation_id,
            "access_token": access_token,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["id"]


def main() -> None:
    openai_api_key = require_env("OPENAI_API_KEY")
    imgbb_api_key = require_env("IMGBB_API_KEY")
    ig_user_id = require_env("IG_USER_ID")
    ig_access_token = require_env("IG_ACCESS_TOKEN")

    prompt = pick_today_prompt()
    caption = random.choice(CAPTION_TEMPLATES)

    print(f"[1/4] Görsel üretiliyor... prompt: {prompt}")
    image_bytes = generate_image(openai_api_key, prompt)

    print("[2/4] Görsel imgbb'ye yükleniyor...")
    image_url = upload_to_imgbb(imgbb_api_key, image_bytes)
    print(f"      Görsel URL: {image_url}")

    print("[3/4] Instagram medya konteyneri oluşturuluyor...")
    creation_id = create_media_container(ig_user_id, ig_access_token, image_url, caption)

    # Instagram'ın konteyneri işlemesi için kısa bir bekleme.
    time.sleep(5)

    print("[4/4] Instagram'da yayınlanıyor...")
    media_id = publish_media(ig_user_id, ig_access_token, creation_id)

    print(f"Tamamlandı. Yayınlanan medya ID: {media_id}")


if __name__ == "__main__":
    main()
