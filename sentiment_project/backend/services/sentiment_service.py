from textblob import TextBlob
import re


def clean_text(text: str) -> str:
    """Remove HTML tags and special characters."""
    text = re.sub(r"<.*?>", "", text)
    text = re.sub(r"[^a-zA-Z0-9\s.,!?']", "", text)
    return text.strip()


def analyze_sentiment(text: str) -> dict:
    """Analyze sentiment using TextBlob."""
    cleaned = clean_text(text)
    blob = TextBlob(cleaned)
    polarity     = blob.sentiment.polarity       # -1.0 to 1.0
    subjectivity = blob.sentiment.subjectivity   # 0.0 to 1.0

    if polarity > 0.1:
        label = "positive"
    elif polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"

    return {
        "library":      "textblob",
        "polarity":     round(polarity, 4),
        "subjectivity": round(subjectivity, 4),
        "final_label":  label,
        "cleaned_text": cleaned,
    }


def extract_keywords(reviews: list, top_n: int = 20) -> list:
    """Word-frequency keyword extraction."""
    STOP = {
        "the","a","an","and","or","but","in","on","at","to","for","of","is",
        "it","this","that","was","are","be","as","with","its","i","my","we",
        "you","he","she","they","have","has","had","not","no","so","do","did",
        "does","if","by","from","very","just","there","their","what","which",
        "who","can","all","would","been","more","also","will","about","out",
        "up","than","then","them","into","these","those","some","were","after",
        "before","when","while","how","get","got","product","item","bought",
        "purchase","order","ordered",
    }
    freq: dict = {}
    for review in reviews:
        for word in re.findall(r"[a-z]{3,}", review.lower()):
            if word not in STOP:
                freq[word] = freq.get(word, 0) + 1
    return [
        {"word": w, "count": c}
        for w, c in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_n]
    ]
