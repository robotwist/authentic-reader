print("Starting ChromaDB test...")

try:
    import chromadb
    print("Successfully imported chromadb")
    print("ChromaDB version:", chromadb.__version__)
    
    # Try to create a client
    client = chromadb.PersistentClient(path="./chroma_db")
    print("Successfully created ChromaDB client")
    
    # List all collections
    collections = client.list_collections()
    print("Collections:", [c.name for c in collections])
    
    # Create a test collection
    test_collection = client.get_or_create_collection("test_collection")
    print("Created test collection")
    
    print("ChromaDB test successful!")
except Exception as e:
    print("Error:", str(e))
    import traceback
    traceback.print_exc() 