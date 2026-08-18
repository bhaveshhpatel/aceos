import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://aceos-ai.vercel.app"

def test_live_deployment():
    print(f"Starting E2E live audit against {BASE_URL}...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # 1. Landing / Public routes
        public_routes = [
            "/",
            "/signin",
            "/signup",
            "/pricing",
            "/legal/privacy-policy",
            "/legal/terms-of-service",
            "/auth/consent-expired",
            "/auth/consent-already-actioned"
        ]

        for route in public_routes:
            url = f"{BASE_URL}{route}"
            print(f"Testing public route {url}...")
            res = page.goto(url, wait_until="domcontentloaded")
            print(f"[{res.status}] {route}")

        # 2. Interactive routes / App Shell routes
        app_routes = [
            "/dashboard",
            "/onboarding/consent",
            "/onboarding/awaiting-consent",
            "/onboarding/subjects",
            "/diagnostic/ap-calculus-ab",
            "/diagnostic/ap-calculus-ab/results",
            "/study/queue",
            "/study/drill",
            "/frq/ap-us-history",
            "/exam/ap-calculus-ab",
            "/exam/ap-calculus-ab/report"
        ]

        for route in app_routes:
            url = f"{BASE_URL}{route}"
            print(f"Testing app route {url}...")
            res = page.goto(url, wait_until="domcontentloaded")
            print(f"[{res.status}] {route}")

        browser.close()
    print("E2E live audit completed.")

if __name__ == "__main__":
    test_live_deployment()
