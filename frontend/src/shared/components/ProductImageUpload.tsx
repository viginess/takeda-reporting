import React, { useState } from 'react';
import {
  FormControl,
  FormLabel,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Image,
  IconButton,
} from '@chakra-ui/react';
import { HiOutlineTrash, HiOutlinePhoto } from 'react-icons/hi2';
import { LiaCloudUploadAltSolid } from 'react-icons/lia';

interface UploadedImage {
  name: string;
  base64: string;   // full data-URL string, e.g. "data:image/png;base64,..."
  size: number;
}

interface ProductImageUploadProps {
  label?: string;
  maxFiles?: number;
  maxFileSizeMB?: number;
  onChange?: (base64Array: string[]) => void; // called whenever files change
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  label = 'Can you take a photo of the product packaging, including batch / lot number information?',
  maxFiles = 3,
  maxFileSizeMB = 15,
  onChange,
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setError('');

    const incoming = Array.from(files);
    const maxBytes = maxFileSizeMB * 1024 * 1024;

    // Validate size
    const oversized = incoming.filter((f) => f.size > maxBytes);
    if (oversized.length) {
      setError(`File(s) exceed ${maxFileSizeMB}MB limit: ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }

    // Cap total files
    const remaining = maxFiles - images.length;
    const toProcess = incoming.slice(0, remaining);

    if (incoming.length > remaining) {
      setError(`Max ${maxFiles} files allowed. Only ${remaining} more can be added.`);
    }

    // Convert to base64
    const converted: UploadedImage[] = await Promise.all(
      toProcess.map(async (file) => ({
        name: file.name,
        base64: await toBase64(file),
        size: file.size,
      }))
    );

    const next = [...images, ...converted];
    setImages(next);
    onChange?.(next.map((img) => img.base64));
  };

  const deleteImage = (name: string) => {
    const next = images.filter((img) => img.name !== name);
    setImages(next);
    onChange?.(next.map((img) => img.base64));
  };

  return (
    <FormControl mb={8}>
      <FormLabel fontWeight="500" color="gray.700">
        {label}
      </FormLabel>

      {/* Drop zone / click area */}
      <Box
        border="2px dashed"
        borderColor={error ? 'red.300' : 'gray.300'}
        borderRadius="lg"
        p={6}
        textAlign="center"
        bg="gray.50"
        cursor="pointer"
        _hover={{ borderColor: 'gray.400', bg: 'gray.100' }}
        onClick={() => inputRef.current?.click()}
        transition="all 0.15s"
      >
        <VStack spacing={2}>
          <Box as={LiaCloudUploadAltSolid} fontSize="2xl" color="gray.400" />
          <Text fontSize="sm" color="gray.500">
            Drag & drop or click to select
          </Text>
          <Button
            variant="outline"
            size="sm"
            borderColor="gray.300"
            leftIcon={<HiOutlinePhoto />}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Choose images
          </Button>
          <Text fontSize="xs" color="gray.400">
            Max {maxFiles} files · Max {maxFileSizeMB}MB each · Images only
          </Text>
        </VStack>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </Box>

      {/* Error */}
      {error && (
        <Text fontSize="xs" color="red.500" mt={2}>
          {error}
        </Text>
      )}

      {/* Preview list */}
      {images.length > 0 && (
        <VStack align="stretch" mt={3} spacing={2}>
          {images.map((img) => (
            <HStack
              key={img.name}
              justify="space-between"
              bg="white"
              p={2}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            >
              <HStack spacing={3}>
                <Image
                  src={img.base64}
                  alt={img.name}
                  boxSize="36px"
                  borderRadius="sm"
                  objectFit="cover"
                  border="1px solid"
                  borderColor="gray.200"
                />
                <Box>
                  <Text fontSize="xs" fontWeight="500" isTruncated maxW="200px">
                    {img.name}
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {(img.size / 1024).toFixed(1)} KB
                  </Text>
                </Box>
              </HStack>
              <IconButton
                aria-label="Remove image"
                icon={<HiOutlineTrash />}
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={() => deleteImage(img.name)}
              />
            </HStack>
          ))}
        </VStack>
      )}
    </FormControl>
  );
};
