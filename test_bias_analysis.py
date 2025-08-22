#!/usr/bin/env python3
"""
Test script for bias analysis pipeline
"""

import requests
import json

def test_bias_analysis():
    """Test the bias analysis endpoint"""
    
    # Test cases
    test_cases = [
        {
            "name": "Right-leaning bias",
            "text": "The radical left agenda is destroying our traditional values and the free market system.",
            "expected_bias": "high"
        },
        {
            "name": "Left-leaning bias", 
            "text": "Systemic racism and income inequality are destroying our society. We need social justice and universal healthcare.",
            "expected_bias": "high"
        },
        {
            "name": "Neutral text",
            "text": "The weather today is sunny with a temperature of 75 degrees. Many people enjoy outdoor activities.",
            "expected_bias": "low"
        },
        {
            "name": "Emotional bias",
            "text": "This is absolutely disgusting and outrageous! How dare they do this terrible thing!",
            "expected_bias": "high"
        }
    ]
    
    print("🧪 Testing Bias Analysis Pipeline")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"Text: {test_case['text'][:50]}...")
        
        try:
            response = requests.post(
                "http://localhost:8104/analyze",
                headers={"Content-Type": "application/json"},
                json={
                    "text": test_case["text"],
                    "analysis_type": "bias",
                    "depth": "medium"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                result = data["result"]["parsed_analysis"]
                
                print(f"✅ Analysis successful!")
                print(f"   Method: {data['result'].get('analysis_method', 'unknown')}")
                print(f"   Political bias: {result['bias_scores']['political']:.1f}/10")
                print(f"   Ideological bias: {result['bias_scores']['ideological']:.1f}/10")
                print(f"   Partisan bias: {result['bias_scores']['partisan']:.1f}/10")
                print(f"   Confidence: {result.get('confidence', 0):.1%}")
                print(f"   Assessment: {result['overall_bias_assessment']}")
                
                if result.get('detected_bias_phrases'):
                    print(f"   Detected phrases: {', '.join(result['detected_bias_phrases'][:3])}")
                
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Bias Analysis Pipeline Test Complete!")

def test_sentiment_analysis():
    """Test the sentiment analysis endpoint"""
    
    test_cases = [
        {
            "name": "Positive sentiment",
            "text": "This is wonderful and amazing! I'm so happy and excited about this great news.",
            "expected": "positive"
        },
        {
            "name": "Negative sentiment",
            "text": "This is terrible and awful. I'm so sad and disappointed about this bad news.",
            "expected": "negative"
        },
        {
            "name": "Neutral sentiment",
            "text": "The report shows data from the study. The results indicate various factors.",
            "expected": "neutral"
        }
    ]
    
    print("\n🧪 Testing Sentiment Analysis Pipeline")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"Text: {test_case['text'][:50]}...")
        
        try:
            response = requests.post(
                "http://localhost:8104/analyze",
                headers={"Content-Type": "application/json"},
                json={
                    "text": test_case["text"],
                    "analysis_type": "sentiment",
                    "depth": "medium"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                result = data["result"]["parsed_analysis"]
                
                print(f"✅ Analysis successful!")
                print(f"   Method: {data['result'].get('analysis_method', 'unknown')}")
                print(f"   Sentiment: {result['overall_sentiment']}")
                print(f"   Score: {result['sentiment_score']:.3f}")
                print(f"   Emotional intensity: {result['emotional_intensity']:.1%}")
                print(f"   Confidence: {result.get('confidence', 0):.1%}")
                
                if result.get('primary_emotions'):
                    emotions = result['primary_emotions']
                    print(f"   Primary emotions: {', '.join([e['emotion'] for e in emotions])}")
                
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Sentiment Analysis Pipeline Test Complete!")

if __name__ == "__main__":
    test_bias_analysis()
    test_sentiment_analysis()
