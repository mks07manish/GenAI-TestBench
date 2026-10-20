
def retrieval_metrics(
    relevant_ids: list[str],
    retrieved_ids: list[str],
    k: int,
) -> dict:
    """Evaluate retrieval quality using known relevant chunk IDs."""

    if k < 1:
        raise ValueError("k must be at least 1")

    relevant = set(relevant_ids)
    retrieved = retrieved_ids[:k]
    retrieved_set = set(retrieved)

    if not relevant:
        return {
            "precision_at_k": None,
            "recall_at_k": None,
            "hit_rate_at_k": None,
            "mrr_at_k": None,
            "relevant_count": 0,
            "retrieved_count": len(retrieved),
        }

    hits = relevant.intersection(retrieved_set)
    ranked_hits = [
        index
        for index, chunk_id in enumerate(retrieved, start=1)
        if chunk_id in relevant
    ]

    precision = len(hits) / k
    recall = len(hits) / len(relevant)
    reciprocal_rank = 1 / ranked_hits[0] if ranked_hits else 0.0

    return {
        "precision_at_k": round(precision, 4),
        "recall_at_k": round(recall, 4),
        "hit_rate_at_k": 1.0 if hits else 0.0,
        "mrr_at_k": round(reciprocal_rank, 4),
        "relevant_count": len(relevant),
        "retrieved_count": len(retrieved),
    }
