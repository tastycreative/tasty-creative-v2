import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadToS3 = async (
  file: Buffer,
  fileName: string,
  contentType: string,
  userId: string,
  folder?: string
) => {
  const key = folder 
    ? `instagram-staging/${userId}/${folder}/${fileName}`
    : `instagram-staging/${userId}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read', // Make the file publicly readable
  });

  await s3Client.send(command);
  
  return {
    key,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
};

export const listUserFiles = async (userId: string, folder?: string) => {
  const prefix = folder 
    ? `instagram-staging/${userId}/${folder}/`
    : `instagram-staging/${userId}/`;

  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET!,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  
  // Filter out placeholder files
  return response.Contents?.filter((item) => 
    !item.Key!.endsWith('.placeholder')
  ).map((item) => ({
    key: item.Key!,
    size: item.Size!,
    lastModified: item.LastModified!,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
  })) || [];
};

export const listAllFilesInFolder = async (userId: string, folder: string) => {
  const prefix = `instagram-staging/${userId}/${folder}/`;

  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET!,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  
  // Return ALL files including placeholders for deletion
  return response.Contents?.map((item) => ({
    key: item.Key!,
    size: item.Size!,
    lastModified: item.LastModified!,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
  })) || [];
};

export const deleteFromS3 = async (key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  });

  await s3Client.send(command);
};

export const listUserFolders = async (userId: string) => {
  const prefix = `instagram-staging/${userId}/`;

  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET!,
    Prefix: prefix,
    Delimiter: '/',
  });

  const response = await s3Client.send(command);
  
  return response.CommonPrefixes?.map((item) => {
    const folderPath = item.Prefix!;
    const folderName = folderPath.replace(prefix, '').replace('/', '');
    return folderName;
  }) || [];
};

export { s3Client };
