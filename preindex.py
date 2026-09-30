import time
from main import build_index, vector_store, load_index_cache

print("Checking index cache...")
if load_index_cache():
    print(f"Loaded {vector_store.size} chunks from cache.")
else:
    print("Building initial index from data directory...")
    t0 = time.time()
    count = build_index()
    print(f"Indexing complete! {count} chunks indexed in {round(time.time() - t0, 1)}s.")
