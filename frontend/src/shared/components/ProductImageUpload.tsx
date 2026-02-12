import React from 'react';
import {
  FormControl,
  FormLabel,
  Button,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import {
  FileUpload,
  FileUploadTrigger,
  FileUploadDropzone,
} from '@saas-ui/file-upload';

import { LiaCloudUploadAltSolid } from "react-icons/lia";
interface ProductImageUploadProps {
  label?: string;
  maxFiles?: number;
  maxFileSize?: number;
  mb?: number | string;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  label = 'Can you take a photo of the product packaging, including batch / lot number information?',
  maxFiles = 3,
  maxFileSize = 15 * 1024 * 1024,
  mb = 8,
}) => {
  return (
    <FormControl mb={mb}>
      <FormLabel fontWeight="500" color="gray.700">
        {label}
      </FormLabel>
      <FileUpload
        maxFileSize={maxFileSize}
        maxFiles={maxFiles}
        accept="image/*"
      >
        {({ acceptedFiles, deleteFile }) => (
          <FileUploadDropzone
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="lg"
            p={8}
            textAlign="center"
            bg="gray.50"
            _hover={{ borderColor: 'gray.400', bg: 'gray.100' }}
          >
            <VStack spacing={2}>
              <Text fontSize="sm" color="gray.500">
                Drag your images here or click to select
              </Text>
              {!acceptedFiles?.length ? (
                <FileUploadTrigger as={Button} variant="outline" size="lg" borderColor="gray.300" leftIcon={<LiaCloudUploadAltSolid />}>
                  Upload
                </FileUploadTrigger>
              ) : (
                <VStack align="stretch" w="full" mt={2}>
                  {acceptedFiles.map((file) => (
                    <HStack
                      key={file.name}
                      justify="space-between"
                      bg="white"
                      p={2}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <Text fontSize="xs" isTruncated maxW="200px">
                        {file.name}
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file);
                        }}
                      >
                        Clear
                      </Button>
                    </HStack>
                  ))}
                  {acceptedFiles.length < maxFiles && (
                    <FileUploadTrigger as={Button} size="xs" variant="link" colorScheme="blue">
                      Add more files
                    </FileUploadTrigger>
                  )}
                </VStack>
              )}
              <Text fontSize="xs" color="gray.400">
                Max files: {maxFiles} · Max size per file: {Math.round(maxFileSize / (1024 * 1024))}MB
              </Text>
            </VStack>
          </FileUploadDropzone>
        )}
      </FileUpload>
    </FormControl>
  );
};
