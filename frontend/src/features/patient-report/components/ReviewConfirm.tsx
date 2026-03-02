import {
  Heading,
  Flex,
  Button,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Box,
  Checkbox,
  Link,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { useStepperContext } from '@saas-ui/react';
import { useFormContext, useWatch } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import { useTranslation, Trans } from 'react-i18next';

function EditLink({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Box
      as="span"
      ml={2} px={2} py={1}
      fontSize="xs" fontWeight="500" color="gray.500"
      cursor="pointer" borderRadius="md"
      _hover={{ color: '#CE0037', bg: 'red.50' }}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClick(); }}
    >
      ✎ {t('forms.patient.reviewConfirm.edit')}
    </Box>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const empty = !value || value === '—';
  return (
    <Flex justify="space-between" py={2} borderBottom="1px solid" borderColor="gray.100" align="flex-start" gap={4}>
      <Text color="gray.600" fontSize="sm" flex="1">{label}</Text>
      <Text fontWeight="500" fontSize="sm" textAlign="right" color={empty ? 'gray.400' : 'gray.800'}>{value}</Text>
    </Flex>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text fontWeight="600" fontSize="sm" color="gray.700" mt={3} mb={1}>{children}</Text>;
}

interface ReviewConfirmProps {
  accordionIndex: number[];
  setAccordionIndex: (val: number[]) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (val: boolean) => void;
  captchaChecked: boolean;
  setCaptchaChecked: (val: boolean) => void;
  onBack?: () => void;
  primaryButtonStyles: any;
}

export function ReviewConfirm({
  accordionIndex,
  setAccordionIndex,
  agreedToTerms,
  setAgreedToTerms,
  captchaChecked,
  setCaptchaChecked,
}: ReviewConfirmProps) {
  const { t } = useTranslation();
  const { setStep } = useStepperContext();
  const { control, setValue, register } = useFormContext();

  const products = useWatch({ control, name: 'products' }) ?? [];
  const symptoms = useWatch({ control, name: 'symptoms' }) ?? [];
  const otherMedications = useWatch({ control, name: 'otherMedications' }) ?? [];
  const medicalHistory = useWatch({ control, name: 'medicalHistory' }) ?? [];
  const labTests = useWatch({ control, name: 'labTests' }) ?? [];
  const attachments = useWatch({ control, name: 'attachments' }) ?? [];

  // Step 3 — nested objects
  const patientDetails = useWatch({ control, name: 'patientDetails' }) ?? {};
  const hcpDetails = useWatch({ control, name: 'hcpDetails' }) ?? {};

  const v = (val: any) => (val && String(val).trim() ? String(val) : '—');
  const arr = (val: any) => Array.isArray(val) ? val.join(', ') : '—';
  const ageDisplay = patientDetails.dob
    ? `${t('forms.patient.personalDetails.dobLabel')}: ${patientDetails.dob}`
    : patientDetails.ageValue
    ? `${patientDetails.ageValue} ${t('forms.patient.personalDetails.years').toLowerCase()}`
    : '—';

  return (
    <>
      <Heading as="h2" size="lg" mb={4} color="gray.800" fontWeight="600">
        {t('forms.patient.reviewConfirm.title')}
      </Heading>
      <Flex justify="flex-end" mb={4}>
        <Button variant="ghost" size="sm" color="gray.600" onClick={() => setAccordionIndex([])}>
          {t('forms.patient.reviewConfirm.hideAll')}
        </Button>
      </Flex>

      <Accordion
        allowMultiple
        index={accordionIndex}
        onChange={(exp) => setAccordionIndex(Array.isArray(exp) ? exp : [exp])}
        borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden" mb={6}
      >
        {/* ── PRODUCTS ── */}
        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Flex align="center" gap={2}>
              <Text>{t('forms.patient.productDetails.title')}</Text>
              {products.length > 0 && <Badge colorScheme="red" fontSize="xs">{products.length}</Badge>}
            </Flex>
            <EditLink onClick={() => setStep('product')} />
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {products.length === 0 && <Text fontSize="sm" color="gray.400">{t('forms.patient.reviewConfirm.noProducts')}</Text>}
            {products.map((p: any, i: number) => (
              <Box key={i} mb={i < products.length - 1 ? 4 : 0}>
                {products.length > 1 && <SectionTitle>{t('forms.patient.reviewConfirm.productNum', { num: i + 1 })}</SectionTitle>}
                <ReviewRow label={t('forms.patient.productDetails.productNameLabel')} value={v(p?.productName)} />
                {/* conditions array */}
                {(p?.conditions ?? []).length > 0 && (
                  <ReviewRow
                    label={t('forms.patient.productDetails.conditionsLabel')}
                    value={(p.conditions as any[]).map((c: any) => c?.name).filter(Boolean).join(', ') || '—'}
                  />
                )}
                <ReviewRow label={t('forms.patient.productDetails.actionTakenLabel')} value={v(p?.actionTaken)} />
                {/* batches */}
                {(p?.batches ?? []).map((b: any, bi: number) => (
                  <Box key={bi} pl={3} borderLeft="2px solid" borderColor="gray.100" mt={2}>
                    <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>{t('forms.patient.productDetails.batchNum', { num: bi + 1 })}</Text>
                    <ReviewRow label={t('forms.patient.productDetails.batchLotNumberLabel')} value={v(b?.batchNumber)} />
                    <ReviewRow label={t('forms.patient.productDetails.expiryDateLabel')} value={v(b?.expiryDate)} />
                    <ReviewRow label={t('forms.patient.productDetails.startDateLabel')} value={v(b?.startDate)} />
                    <ReviewRow label={t('forms.patient.productDetails.endDateLabel')} value={v(b?.endDate)} />
                    <ReviewRow label={t('forms.patient.productDetails.dosageLabel')} value={v(b?.dosage)} />
                  </Box>
                ))}
                {i < products.length - 1 && <Divider my={3} />}
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

        {/* ── SYMPTOMS / EVENTS ── */}
        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Flex align="center" gap={2}>
              <Text>{t('forms.patient.eventDetails.title')}</Text>
              {symptoms.length > 0 && <Badge colorScheme="orange" fontSize="xs">{symptoms.length}</Badge>}
            </Flex>
            <EditLink onClick={() => setStep('event')} />
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {symptoms.length === 0 && <Text fontSize="sm" color="gray.400">{t('forms.patient.reviewConfirm.noSymptoms')}</Text>}
            {symptoms.map((s: any, i: number) => (
              <Box key={i} mb={i < symptoms.length - 1 ? 4 : 0}>
                {symptoms.length > 1 && <SectionTitle>{t('forms.patient.eventDetails.symptomIndex', { num: i + 1 })}</SectionTitle>}
                <ReviewRow label={t('forms.patient.eventDetails.symptomLabel')} value={v(s?.name)} />
                <ReviewRow label={t('forms.patient.eventDetails.startDateLabel')} value={v(s?.eventStartDate)} />
                <ReviewRow label={t('forms.patient.eventDetails.endDateLabel')} value={v(s?.eventEndDate)} />
                <ReviewRow label={t('forms.patient.eventDetails.treatedLabel')} value={v(s?.symptomTreated)} />
                {s?.symptomTreated === 'yes' && <ReviewRow label={t('forms.patient.eventDetails.treatmentLabel')} value={v(s?.treatment)} />}
                <ReviewRow label={t('forms.patient.eventDetails.seriousLabel')} value={v(s?.seriousness)} />
                <ReviewRow label={t('forms.patient.eventDetails.outcomeLabel')} value={v(s?.outcome)} />
                {i < symptoms.length - 1 && <Divider my={3} />}
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

        {/* ── PERSONAL ── */}
        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Text>{t('forms.patient.personalDetails.title')}</Text>
            <EditLink onClick={() => setStep('personal')} />
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <SectionTitle>{t('forms.patient.reviewConfirm.patientReviewTitle')}</SectionTitle>
            <ReviewRow label={t('forms.patient.reviewConfirm.fullName')} value={v(patientDetails.name)} />
            <ReviewRow label={t('forms.patient.personalDetails.initialsLabel')} value={v(patientDetails.initials)} />
            <ReviewRow label={t('forms.patient.personalDetails.sexLabel')} value={v(patientDetails.gender)} />
            <ReviewRow label={t('forms.patient.reviewConfirm.ageDob')} value={ageDisplay} />
            <ReviewRow label={t('forms.patient.personalDetails.emailLabel')} value={v(patientDetails.email)} />
            <ReviewRow label={t('forms.patient.personalDetails.contactPermissionLabel')} value={v(patientDetails.contactPermission)} />

            {(hcpDetails.firstName || hcpDetails.lastName || hcpDetails.email || hcpDetails.phone) && (
              <>
                <SectionTitle>{t('forms.patient.reviewConfirm.hcpReviewTitle')}</SectionTitle>
                <ReviewRow label={t('forms.patient.personalDetails.nameLabel')} value={[v(hcpDetails.firstName), v(hcpDetails.lastName)].filter(x => x !== '—').join(' ') || '—'} />
                <ReviewRow label={t('forms.patient.personalDetails.emailLabel')} value={v(hcpDetails.email)} />
                <ReviewRow label={t('forms.patient.personalDetails.phoneLabel')} value={v(hcpDetails.phone)} />
                <ReviewRow label={t('forms.patient.personalDetails.institutionLabel')} value={v(hcpDetails.institution)} />
                <ReviewRow label={t('forms.patient.personalDetails.addressLabel')} value={[v(hcpDetails.address), v(hcpDetails.city), v(hcpDetails.state), v(hcpDetails.country)].filter(x => x !== '—').join(', ') || '—'} />
              </>
            )}
          </AccordionPanel>
        </AccordionItem>

        {/* ── ADDITIONAL ── */}
        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Text>{t('forms.patient.additionalDetails.title')}</Text>
            <EditLink onClick={() => setStep('additional')} />
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {/* Other medications */}
            {otherMedications.length > 0 ? (
              <>
                <SectionTitle>{t('forms.patient.reviewConfirm.otherMedsReviewTitle', { count: otherMedications.length })}</SectionTitle>
                {otherMedications.map((m: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={t('forms.patient.additionalDetails.medicationIndex', { index: i + 1 })} value={v(m?.product)} />
                    <ReviewRow label={t('forms.patient.productDetails.conditionLabel')} value={v(m?.condition)} />
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label={t('forms.patient.additionalDetails.otherMedsLabel')} value={t('forms.patient.common.none')} />
            )}

            {/* Medical history */}
            {medicalHistory.length > 0 ? (
              <>
                <SectionTitle>{t('forms.patient.reviewConfirm.medicalHistoryReviewTitle', { count: medicalHistory.length })}</SectionTitle>
                {medicalHistory.map((h: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={t('forms.patient.additionalDetails.historyIndex', { index: i + 1 })} value={v(h?.conditionName)} />
                    {h?.info && <ReviewRow label={t('forms.patient.additionalDetails.historyInfoLabel')} value={v(h?.info)} />}
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label={t('forms.patient.additionalDetails.medicalHistoryLabel')} value={t('forms.patient.common.none')} />
            )}

            {/* Lab tests */}
            {labTests.length > 0 ? (
              <>
                <SectionTitle>{t('forms.patient.reviewConfirm.labTestsReviewTitle', { count: labTests.length })}</SectionTitle>
                {labTests.map((t: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={t('forms.patient.additionalDetails.testIndex', { index: i + 1 })} value={v(t?.testName)} />
                    <ReviewRow label={t('forms.patient.additionalDetails.testResultLabel')} value={[v(t?.testQualifier), v(t?.testValue)].filter(x => x !== '—').join(' ') || '—'} />
                    {t?.outcome?.length > 0 && <ReviewRow label={t('forms.patient.additionalDetails.testOutcomeLabel')} value={arr(t?.outcome)} />}
                    {t?.testComments && <ReviewRow label={t('forms.patient.additionalDetails.testCommentsLabel')} value={v(t?.testComments)} />}
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label={t('forms.patient.additionalDetails.labTestsLabel')} value={t('forms.patient.common.none')} />
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <>
                <SectionTitle>{t('forms.patient.reviewConfirm.attachmentsReviewTitle')}</SectionTitle>
                <ReviewRow label={t('forms.patient.additionalDetails.attachmentsLabel')} value={t('forms.patient.reviewConfirm.filesUploaded', { count: attachments.length })} />
              </>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* reCAPTCHA */}
      <input type="hidden" {...register('captchaChecked', { required: true, validate: (v: any) => v === true })} />
      {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
        <Box mb={6}>
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => {
              setCaptchaChecked(!!token);
              setValue('captchaChecked', !!token, { shouldValidate: true });
            }}
            onExpired={() => {
              setCaptchaChecked(false);
              setValue('captchaChecked', false, { shouldValidate: true });
            }}
          />
        </Box>
      ) : (
        <Box p={3} mb={6} borderRadius="md" bg="yellow.50" borderWidth="1px" borderColor="yellow.300">
          <Text fontSize="xs" color="yellow.700">
            ⚠️ reCAPTCHA site key missing. Add <strong>VITE_RECAPTCHA_SITE_KEY</strong> to <code>frontend/.env</code>
          </Text>
        </Box>
      )}

      {/* Terms */}
      <Box mb={6} fontSize="sm" color="gray.600">
        <Checkbox
          colorScheme="red"
          isChecked={agreedToTerms}
          {...register('agreedToTerms', { required: true })}
          onChange={(e) => {
            setAgreedToTerms(e.target.checked);
            setValue('agreedToTerms', e.target.checked, { shouldValidate: true });
          }}
        >
          <Trans
            i18nKey="forms.patient.reviewConfirm.terms.agreeLabel"
            values={{
              privacy: t('forms.patient.reviewConfirm.terms.privacy'),
              terms: t('forms.patient.reviewConfirm.terms.terms')
            }}
            components={{
              privacy: <Link href="https://www.takeda.com/privacy-notice/" isExternal color="#CE0037" textDecoration="underline" />,
              terms: <Link href="https://www.takeda.com/terms-and-conditions/" isExternal color="#CE0037" textDecoration="underline" />
            }}
          />
        </Checkbox>
      </Box>

      {(!agreedToTerms || !captchaChecked) && (
        <Text fontSize="xs" color="red.400" mb={2}>
          {!captchaChecked && !agreedToTerms
            ? t('forms.patient.reviewConfirm.bothRequired')
            : !captchaChecked
            ? t('forms.patient.reviewConfirm.captchaRobot')
            : t('forms.patient.reviewConfirm.termsAgreement')}
        </Text>
      )}
    </>
  );
}
