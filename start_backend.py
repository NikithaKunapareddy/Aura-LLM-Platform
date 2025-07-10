#!/usr/bin/env python3
"""
Simple backend starter script to test if everything is working.
"""
import sys
import os



def check_dependencies():
    """Check if required dependencies are installed."""
    required_packages = [
        'fastapi',
        'uvicorn',
        'pydantic',
        'torch',
        'transformers'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} is installed")
        except ImportError:
            print(f"❌ {package} is missing")
            missing_packages.append(package)
    
    return missing_packages


def main():

    print("🚀 Starting LLM Chat Backend...")
    print(f"Python executable: {sys.executable}")
    print(f"Working directory: {os.getcwd()}")

    # Check dependencies
    missing = check_dependencies()

    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print("Please install them with:")
        print(f"pip install {' '.join(missing)}")
        return False

    # Try to start the server
    try:
        print("\n🌟 All dependencies found! Starting FastAPI server...")
        import uvicorn

        uvicorn.run(
            "gemma_api:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )

    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False

    return True


if __name__ == "__main__":
    main()
