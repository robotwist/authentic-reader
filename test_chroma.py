import chromadb
import traceback

try:
    print("Connecting to ChromaDB...")
    # Connect to the running ChromaDB
    client = chromadb.PersistentClient(path="./chroma_db")
    print("Connected to ChromaDB client")

    # Get the feedback collection
    print("Getting collection 'feedback'...")
    collection = client.get_collection(name="feedback")
    print("Got collection:", collection.name)

    # Add a test document
    print("Adding test document...")
    collection.add(
        documents=["This is a test document for ChromaDB"],
        metadatas=[{"source": "test_script", "timestamp": "2023-05-01"}],
        ids=["test1"]
    )
    print("Document added successfully")

    # Query to verify it works
    print("Querying document...")
    results = collection.query(
        query_texts=["test document"],
        n_results=1
    )

    print("Successfully connected to ChromaDB")
    print("Query results:", results)
    print("ChromaDB is working correctly!")
except Exception as e:
    print("Error:", str(e))
    print(traceback.format_exc()) 