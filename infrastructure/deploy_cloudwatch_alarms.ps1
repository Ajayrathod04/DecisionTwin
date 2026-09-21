# DecisionTwin CloudWatch Alarm Deployment & Verification Script
param(
    [string]$EnvironmentName = "Decisiontwin-env",
    [string]$Region = "ap-south-1"
)

Write-Host "[AWS CloudWatch] Deploying alarms for Elastic Beanstalk Environment: $EnvironmentName in $Region..."

# 1. Put High 5xx Error Rate Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "DecisionTwin-High-5xx-Rate" `
    --alarm-description "Triggers if DecisionTwin backend returns >5 5xx errors in 5 minutes." `
    --metric-name "HTTPCode_Backend_5XX" `
    --namespace "AWS/ElasticBeanstalk" `
    --statistic "Sum" `
    --period 300 `
    --evaluation-periods 1 `
    --threshold 5 `
    --comparison-operator "GreaterThanThreshold" `
    --dimensions Name=EnvironmentName,Value=$EnvironmentName `
    --region $Region

# 2. Put High Latency Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "DecisionTwin-High-Latency" `
    --alarm-description "Triggers if DecisionTwin simulation endpoint latency exceeds 2.0s." `
    --metric-name "Latency" `
    --namespace "AWS/ElasticBeanstalk" `
    --statistic "Average" `
    --period 300 `
    --evaluation-periods 2 `
    --threshold 2.0 `
    --comparison-operator "GreaterThanOrEqualToThreshold" `
    --dimensions Name=EnvironmentName,Value=$EnvironmentName `
    --region $Region

Write-Host "[AWS CloudWatch] Describing alarm statuses..."
aws cloudwatch describe-alarms --alarm-names "DecisionTwin-High-5xx-Rate" "DecisionTwin-High-Latency" --region $Region
