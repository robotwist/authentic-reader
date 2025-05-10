import chromadb
from chromadb.config import Settings

# Initialize ChromaDB with persistent storage
client = chromadb.PersistentClient(path="./chroma_db")

# Create a collection for feedback if it doesn't exist
collection = client.get_or_create_collection(name="feedback")

print("ChromaDB is running!")
print("Collection 'feedback' is available")
print("To stop, press Ctrl+C")

# Keep the script running
try:
    import time
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("ChromaDB server stopped.") 