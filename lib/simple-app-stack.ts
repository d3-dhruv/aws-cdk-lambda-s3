import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { BucketDeployment } from 'aws-cdk-lib/aws-s3-deployment';
import { Source } from 'aws-cdk-lib/aws-s3-deployment';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';


export class SimpleAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket with S3-managed encryption
    const bucket = new Bucket(this, 'MyFirstBucket', {
      encryption: BucketEncryption.S3_MANAGED,
    });

    new BucketDeployment(this,'MySimpleAppPhotos',{
      sources: [
        Source.asset(path.join(__dirname, '..', 'photos'))
      ],
      destinationBucket: bucket,
  })
    // Lambda Function
    const getphotos = new NodejsFunction(this, 'MySimpleLambda', {
      runtime: Runtime.NODEJS_18_X, // Use a newer runtime if possible
      entry: path.join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'getphotos', // Function name in the index.ts file
      environment: {
        PHOTO_BUCKET_NAME: bucket.bucketName,
      }, // Entry file path

    });

    // Grant Lambda permission to access the S3 bucket
    bucket.grantReadWrite(getphotos);

    const bucketContainerPermissions = new PolicyStatement();
    bucketContainerPermissions.addResources(bucket.bucketArn);
    bucketContainerPermissions.addActions('s3:ListBucket');

    const bucketPermissions = new PolicyStatement();
    bucketPermissions.addResources(`${bucket.bucketArn}/*`);
    bucketPermissions.addActions('s3:GetObject', 's3:PutObject');


    getphotos.addToRolePolicy(bucketContainerPermissions);
    getphotos.addToRolePolicy(bucketContainerPermissions);


    new cdk.CfnOutput(this, 'MySimpleAppBucketNameExport', {
      value: bucket.bucketName,
      exportName: 'MySimpleAppBucketName'
    });
  }
}