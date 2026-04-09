import time, random
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException


# ── Selenium helpers ────────────────────────────────────────────────────────

def _build_driver():
    opts = Options()
    opts.add_argument("--headless")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return webdriver.Chrome(options=opts)


def _delay(lo=1.5, hi=3.5):
    time.sleep(random.uniform(lo, hi))


# ── Amazon ──────────────────────────────────────────────────────────────────

def scrape_amazon_reviews(product_url: str, max_pages: int = 3) -> list:
    driver = _build_driver()
    reviews = []
    try:
        driver.get(product_url)
        _delay()
        try:
            title = driver.find_element(By.ID, "productTitle").text.strip()
        except NoSuchElementException:
            title = "Unknown Product"

        try:
            WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "See all reviews"))
            ).click()
            _delay()
        except TimeoutException:
            pass

        for _ in range(max_pages):
            soup = BeautifulSoup(driver.page_source, "html.parser")
            for rev in soup.select("[data-hook='review']"):
                rating_tag = rev.select_one("[data-hook='review-star-rating'] span")
                body_tag   = rev.select_one("[data-hook='review-body'] span")
                title_tag  = rev.select_one("[data-hook='review-title'] span:not(.a-icon-alt)")
                date_tag   = rev.select_one("[data-hook='review-date']")
                reviews.append({
                    "source":        "amazon",
                    "product_title": title,
                    "product_url":   product_url,
                    "rating":        float(rating_tag.text.strip()[0]) if rating_tag else None,
                    "review_title":  title_tag.text.strip() if title_tag else "",
                    "review_body":   body_tag.text.strip()  if body_tag  else "",
                    "date":          date_tag.text.strip()  if date_tag  else "",
                })
            try:
                driver.find_element(By.CSS_SELECTOR, "li.a-last a").click()
                _delay()
            except NoSuchElementException:
                break
    finally:
        driver.quit()
    return reviews


# ── Flipkart ────────────────────────────────────────────────────────────────

def scrape_flipkart_reviews(product_url: str, max_pages: int = 3) -> list:
    driver = _build_driver()
    reviews = []
    try:
        driver.get(product_url)
        _delay()
        try:
            driver.find_element(By.CSS_SELECTOR, "button._2KpZ6l._2doB4z").click()
        except NoSuchElementException:
            pass
        try:
            title = driver.find_element(By.CSS_SELECTOR, "span.B_NuCI").text.strip()
        except NoSuchElementException:
            title = "Unknown Product"
        try:
            WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "All Reviews"))
            ).click()
            _delay()
        except TimeoutException:
            pass

        for _ in range(max_pages):
            soup = BeautifulSoup(driver.page_source, "html.parser")
            for rev in soup.select("div._16PBlm"):
                rating_tag = rev.select_one("div._3LWZlK")
                title_tag  = rev.select_one("p._2-N8zT")
                body_tag   = rev.select_one("div.t-ZTKy div div")
                date_tag   = rev.select_one("p._2sc7ZR span")
                reviews.append({
                    "source":        "flipkart",
                    "product_title": title,
                    "product_url":   product_url,
                    "rating":        float(rating_tag.text.strip()) if rating_tag else None,
                    "review_title":  title_tag.text.strip() if title_tag else "",
                    "review_body":   body_tag.text.strip()  if body_tag  else "",
                    "date":          date_tag.text.strip()  if date_tag  else "",
                })
            try:
                driver.find_element(By.CSS_SELECTOR, "a._1LKTO3").click()
                _delay()
            except NoSuchElementException:
                break
    finally:
        driver.quit()
    return reviews


# ── Demo data ───────────────────────────────────────────────────────────────

SAMPLE_REVIEWS = [
    {"source":"amazon","product_title":"Demo Product","product_url":"#","rating":5,
     "review_title":"Excellent!","review_body":"This product is absolutely amazing. Highly recommend it!","date":"Jan 1, 2024"},
    {"source":"amazon","product_title":"Demo Product","product_url":"#","rating":1,
     "review_title":"Terrible","review_body":"Terrible quality. Broke after two days. Complete waste of money.","date":"Jan 2, 2024"},
    {"source":"flipkart","product_title":"Demo Product","product_url":"#","rating":4,
     "review_title":"Good value","review_body":"Pretty good for the price. Delivery was fast and packaging was neat.","date":"Jan 3, 2024"},
    {"source":"amazon","product_title":"Demo Product","product_url":"#","rating":3,
     "review_title":"Average","review_body":"It works as described. Nothing special but does the job.","date":"Jan 4, 2024"},
    {"source":"flipkart","product_title":"Demo Product","product_url":"#","rating":5,
     "review_title":"Love it","review_body":"Best purchase this year! Outstanding build quality and great features.","date":"Jan 5, 2024"},
    {"source":"amazon","product_title":"Demo Product","product_url":"#","rating":1,
     "review_title":"Awful","review_body":"Complete junk. The product stopped working immediately. Very unhappy.","date":"Jan 6, 2024"},
    {"source":"flipkart","product_title":"Demo Product","product_url":"#","rating":4,
     "review_title":"Solid product","review_body":"Really solid build quality. Would buy again without hesitation.","date":"Jan 7, 2024"},
    {"source":"amazon","product_title":"Demo Product","product_url":"#","rating":3,
     "review_title":"Okay","review_body":"It is okay. Not bad, not great. Exactly what I expected for the price.","date":"Jan 8, 2024"},
    {"source":"flipkart","product_title":"Demo Product","product_url":"#","rating":5,
     "review_title":"Superb","review_body":"Absolutely superb product. Fast shipping and excellent customer support.","date":"Jan 9, 2024"},
    {"source":"amazon","product_title":"Demo Product","product_url":"#","rating":2,
     "review_title":"Disappointed","review_body":"Very disappointed with the quality. Expected much better for this price.","date":"Jan 10, 2024"},
]


def get_sample_reviews() -> list:
    return SAMPLE_REVIEWS
