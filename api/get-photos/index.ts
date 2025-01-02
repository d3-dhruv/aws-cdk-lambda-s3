import {
    APIGatewayProxyEventV2,
    Context,
    APIGatewayProxyResultV2,
  } from "aws-lambda";
  import * as AWS from "aws-sdk"; // Correct way to import AWS SDK
  const s3 = new AWS.S3(); // Instantiate the S3 client
  const bucketName = process.env.PHOTO_BUCKET_NAME; // Get bucket name from environment variables
  
  // Function to generate a signed URL for an S3 object
  async function generateUrl(
    object: AWS.S3.Object
  ): Promise<{ filename: string; url: string }> {
    const url = await s3.getSignedUrlPromise("getObject", {
      Bucket: bucketName,
      Key: object.Key!, // Use object.Key instead of object.key
      Expires: 60, // 1 minute expiration
    });
    return {
      filename: object.Key!, // Use object.Key instead of object.key
      url: url,
    };
  }
  
  // Lambda function to retrieve and generate signed URLs for S3 objects
  async function getphotos(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyResultV2> {
    console.log("Bucket name is: " + bucketName);

    try {
      if (!bucketName) {
        throw new Error("Bucket name is undefined");
      }
      const { Contents: results } = await s3
        .listObjectsV2({ Bucket: bucketName })
        .promise();

      const photos = await Promise.all(
        results!.map((result: AWS.S3.Object) => generateUrl(result))
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ photos }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: (error as Error).message }),
      };
    }
  }


  
  export { getphotos }; // Export the handler function
  