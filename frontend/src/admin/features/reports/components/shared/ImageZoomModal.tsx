import { 
  Modal, ModalOverlay, ModalContent, ModalCloseButton, 
  ModalBody, Center, Image 
} from "@chakra-ui/react";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
}

export function ImageZoomModal({ isOpen, onClose, imageSrc }: ImageZoomModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent bg="transparent" boxShadow="none">
        <ModalCloseButton color="white" size="lg" zIndex={2} />
        <ModalBody display="flex" alignItems="center" justifyContent="center" p={{ base: 4, md: 0 }} onClick={onClose}>
          <Center w="full" h="full">
            <Image src={imageSrc} maxH="85vh" maxW="90vw" objectFit="contain"
              borderRadius="lg" boxShadow="2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
          </Center>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
