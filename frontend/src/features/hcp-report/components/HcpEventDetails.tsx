import {
  FormControl,
  FormLabel,
  Input,
  Flex,
  Button,
  Heading,
  RadioGroup,
  Stack,
  Radio,
  Box,
  Text,
} from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { MedDRASymptomAutocomplete } from "../../patient-report/components/MedDRASymptomAutocomplete.js";

interface HcpEventDetailsProps {
  inputStyles: any;
  symptomTreated: string;
  setSymptomTreated: (val: string) => void;
  index?: number;
  symptomNumber?: number;
}

export function HcpEventDetails({
  inputStyles,
  symptomTreated,
  setSymptomTreated,
  index = 0,
  symptomNumber = 1,
}: HcpEventDetailsProps) {
  const { t } = useTranslation();
  const { setValue, register, watch } = useFormContext();

  const prefix = `symptoms.${index}`;
  const firstProductName = watch("products.0.productName");

  const setUnknown = (fieldName: string) => {
    setValue(`${prefix}.${fieldName}`, "Unknown");
  };

  const setOngoing = (fieldName: string) => {
    setValue(`${prefix}.${fieldName}`, "Ongoing");
  };

  return (
    <>
      <Heading as="h2" size="lg" mb={6} color="#CE0037" fontWeight="600">
        {t("forms.patient.eventDetails.title")} {symptomNumber > 1 ? `#${symptomNumber}` : ''}
      </Heading>

      <FormControl mb={6} isRequired>
        <FormLabel fontWeight="500" color="gray.700">
          {t("forms.patient.eventDetails.symptomQuestion")}
        </FormLabel>
        <MedDRASymptomAutocomplete
          value={watch(`${prefix}.name`) || ""}
          onChange={(val, code, extra) => {
            setValue(`${prefix}.name`, val, { shouldDirty: true });
            if (code) {
              setValue(`${prefix}.meddraCode`, code, { shouldDirty: true });
            }
            if (extra) {
              setValue(`${prefix}.lltCode`, extra.lltCode, { shouldDirty: true });
              setValue(`${prefix}.lltName`, extra.lltName, { shouldDirty: true });
              setValue(`${prefix}.ptCode`, extra.ptCode, { shouldDirty: true });
              setValue(`${prefix}.ptName`, extra.ptName, { shouldDirty: true });
            }
          }}
          inputStyles={inputStyles}
        />
        <Input type="hidden" {...register(`${prefix}.meddraCode`)} />
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t("forms.patient.eventDetails.dateQuestion")}
        </FormLabel>
        <Flex gap={3} flexWrap="wrap" align="center" mb={2}>
          <Input
            key={
              watch(`${prefix}.eventStartDate`) === "Unknown"
                ? "untouchable"
                : "selectable"
            }
            type={
              watch(`${prefix}.eventStartDate`) === "Unknown" ? "text" : "date"
            }
            value={
              watch(`${prefix}.eventStartDate`) === "Unknown"
                ? t("forms.patient.common.unknown")
                : watch(`${prefix}.eventStartDate`)
            }
            placeholder={t("forms.patient.eventDetails.startDatePlaceholder")}
            flex="1"
            minW="140px"
            {...inputStyles}
            {...register(`${prefix}.eventStartDate`)}
          />
          <Button
            variant="outline"
            size="lg"
            borderColor="gray.300"
            onClick={() => setUnknown("eventStartDate")}
          >
            {t("forms.patient.common.unknown")}
          </Button>
        </Flex>
        <Flex gap={3} flexWrap="wrap" align="center">
          <Input
            key={
              ["Unknown", "Ongoing"].includes(watch(`${prefix}.eventEndDate`))
                ? "untouchable"
                : "selectable"
            }
            type={
              ["Unknown", "Ongoing"].includes(watch(`${prefix}.eventEndDate`))
                ? "text"
                : "date"
            }
            value={
              watch(`${prefix}.eventEndDate`) === "Unknown"
                ? t("forms.patient.common.unknown")
                : watch(`${prefix}.eventEndDate`) === "Ongoing"
                  ? t("forms.patient.common.ongoing")
                  : watch(`${prefix}.eventEndDate`)
            }
            placeholder={t("forms.patient.eventDetails.endDatePlaceholder")}
            flex="1"
            minW="140px"
            {...inputStyles}
            {...register(`${prefix}.eventEndDate`)}
          />
          <Button
            variant="outline"
            size="lg"
            borderColor="gray.300"
            onClick={() => setUnknown("eventEndDate")}
          >
            {t("forms.patient.common.unknown")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            borderColor="gray.300"
            onClick={() => setOngoing("eventEndDate")}
          >
            {t("forms.patient.common.ongoing")}
          </Button>
        </Flex>
      </FormControl>

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t("forms.patient.eventDetails.treatedQuestion")}
        </FormLabel>
        <RadioGroup
          value={symptomTreated}
          onChange={(val) => {
            setSymptomTreated(val);
            setValue(`${prefix}.symptomTreated`, val);
          }}
        >
          <Stack direction="row" spacing={6}>
            <Radio value="yes" colorScheme="red">
              {t("forms.patient.common.yes")}
            </Radio>
            <Radio value="no" colorScheme="red">
              {t("forms.patient.common.no")}
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      {symptomTreated === "yes" && (
        <FormControl mb={6} isRequired>
          <FormLabel fontWeight="500" color="gray.700">
            {t(
              "forms.patient.eventDetails.treatmentLabel",
              "Treatment Details",
            )}
          </FormLabel>
          <Box
            as="textarea"
            width="full"
            p={3}
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.300"
            _focus={{ borderColor: "#CE0037", boxShadow: "0 0 0 1px #CE0037" }}
            rows={3}
            placeholder={t(
              "forms.patient.eventDetails.treatmentPlaceholder",
              "Describe the treatment given...",
            )}
            {...register(`${prefix}.treatment`, {
              required: symptomTreated === "yes",
            })}
          />
        </FormControl>
      )}

      <FormControl mb={6}>
        <FormLabel fontWeight="500" color="gray.700">
          {t("forms.hcp.eventDetails.seriousness.label")}
        </FormLabel>
        <RadioGroup
          value={watch(`${prefix}.seriousness`)}
          onChange={(val) => setValue(`${prefix}.seriousness`, val)}
        >
          <Stack direction="row" spacing={6} flexWrap="wrap">
            <Radio value="not-serious" colorScheme="red">
              {t("forms.hcp.eventDetails.seriousness.not-serious")}
            </Radio>
            <Radio value="medical-intervention" colorScheme="red">
              {t("forms.hcp.eventDetails.seriousness.medical-intervention")}
            </Radio>
            <Radio value="hospitalization" colorScheme="red">
              {t("forms.hcp.eventDetails.seriousness.hospitalization")}
            </Radio>
            <Radio value="life-threatening" colorScheme="red">
              {t("forms.hcp.eventDetails.seriousness.life-threatening")}
            </Radio>
            <Radio value="disability" colorScheme="red">
              {t("forms.hcp.eventDetails.seriousness.disability")}
            </Radio>
            <Radio value="congenital" colorScheme="red">
              {t("forms.hcp.eventDetails.seriousness.congenital")}
            </Radio>
            <Radio value="medically-significant" colorScheme="red">
              {t("forms.hcp.eventDetails.seriousness.medically-significant")}
            </Radio>
            <Radio value="death" colorScheme="red">
              {t("forms.hcp.eventDetails.seriousness.death")}
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <FormControl mb={8}>
        <FormLabel fontWeight="500" color="gray.700">
          {t("forms.hcp.eventDetails.outcome.label")}
        </FormLabel>
        <RadioGroup
          value={watch(`${prefix}.outcome`)}
          onChange={(val) => setValue(`${prefix}.outcome`, val)}
        >
          <Stack direction="row" spacing={6} flexWrap="wrap">
            <Radio value="recovered" colorScheme="red">
              {t("forms.hcp.eventDetails.outcome.recovered")}
            </Radio>
            <Radio value="recovered-lasting" colorScheme="red">
              {t("forms.hcp.eventDetails.outcome.recovered-lasting")}
            </Radio>
            <Radio value="improved" colorScheme="red">
              {t("forms.hcp.eventDetails.outcome.improved")}
            </Radio>
            <Radio value="ongoing" colorScheme="red">
              {t("forms.hcp.eventDetails.outcome.ongoing")}
            </Radio>
          </Stack>
        </RadioGroup>
      </FormControl>

      <Box mt={10} mb={6}>
        <Text fontWeight="600" color="gray.700" fontSize="sm">
          {t("forms.hcp.eventDetails.relatedness.label")}
        </Text>
      </Box>

      <Box
        p={5}
        bg="gray.50"
        borderRadius="xl"
        mb={8}
        border="1px solid"
        borderColor="gray.100"
        boxShadow="sm"
      >
        <Text fontWeight="700" mb={4} color="gray.800" fontSize="sm">
          {t("forms.hcp.eventDetails.relatedness.suspectProduct", {
            product: firstProductName || t("forms.patient.common.unknown"),
          })}
        </Text>
        <RadioGroup
          value={watch(`${prefix}.relatedToProduct`)}
          onChange={(val) => setValue(`${prefix}.relatedToProduct`, val)}
        >
          <Stack spacing={2}>
            <Radio value="yes" colorScheme="red">
              {t("forms.patient.common.yes")}
            </Radio>
            <Radio value="no" colorScheme="red">
              {t("forms.patient.common.no")}
            </Radio>
            <Radio value="unknown" colorScheme="red">
              {t("forms.patient.common.unknown")}
            </Radio>
          </Stack>
        </RadioGroup>
      </Box>


    </>
  );
}
