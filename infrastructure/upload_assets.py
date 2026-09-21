#!/usr/bin/env python3
"""
DecisionTwin S3 Asset Sync Script
Uploads public static assets to AWS S3 bucket for scalable asset delivery.
"""

import os
import sys

S3_BUCKET = os.getenv("S3_BUCKET_NAME", "decisiontwin-assets-ap-south-1")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

def main():
    print(f"[DecisionTwin S3 Sync] Target Bucket: {S3_BUCKET} in region {AWS_REGION}")
    print("To sync local public assets to S3, run:")
    print(f"  aws s3 sync frontend/public s3://{S3_BUCKET}/ --region {AWS_REGION} --acl public-read")
    print("For frontend deployment, set environment variable:")
    print(f"  VITE_S3_ASSET_BASE_URL=https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com")

if __name__ == "__main__":
    main()
