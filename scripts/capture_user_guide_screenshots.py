import time
from playwright.sync_api import sync_playwright

routes = [
    ("/", "docs/images/01_landing.png"),
    ("/signin", "docs/images/02_signin.png"),
    ("/signup", "docs/images/03_signup.png"),
    ("/onboarding/consent", "docs/images/04_parental_consent.png"),
    ("/onboarding/awaiting-consent", "docs/images/05_awaiting_consent.png"),
    ("/onboarding/subjects", "docs/images/06_subject_selection.png"),
    ("/dashboard", "docs/images/07_dashboard.png"),
    ("/diagnostic/ap-calculus-ab", "docs/images/08_diagnostic_quiz.png"),
    ("/diagnostic/ap-calculus-ab/results", "docs/images/09_diagnostic_results.png"),
    ("/study/queue", "docs/images/10_spaced_repetition_queue.png"),
    ("/study/drill", "docs/images/11_weak_concept_drill.png"),
    ("/frq/ap-us-history", "docs/images/12_frq_grader.png"),
    ("/exam/ap-calculus-ab", "docs/images/13_bluebook_exam_simulator.png"),
    ("/exam/ap-calculus-ab/report", "docs/images/14_exam_analytics_report.png"),
    ("/pricing", "docs/images/15_pricing_tiers.png"),
    ("/legal/privacy-policy", "docs/images/16_privacy_policy.png"),
]

def capture_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        for route, filepath in routes:
            url = f"http://localhost:3001{route}"
            print(f"Navigating to {url}...")
            try:
                page.goto(url, wait_until="networkidle", timeout=10000)
                time.sleep(1)
                page.screenshot(path=filepath)
                print(f"Captured {filepath}")
            except Exception as e:
                print(f"Error capturing {url}: {e}")

        browser.close()

if __name__ == "__main__":
    capture_screenshots()
