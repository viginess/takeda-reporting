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
} from '@chakra-ui/react';
import { useStepperContext } from '@saas-ui/react';
import { useFormContext } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import { useTranslation, Trans } from 'react-i18next';

interface ReviewRowProps {
  label: string;
  value: string;
}

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <Flex
      justify="space-between"
      py={2}
      borderBottom="1px solid"
      borderColor="gray.100"
      align="center"
    >
      <Text color="gray.600" fontSize="sm">
        {label}
      </Text>
      <Text fontWeight="500" fontSize="sm">
        {value}
      </Text>
    </Flex>
  );
}

const v = (value: string | undefined | null) => value || '—';
const arr = (value: string[] | undefined | null) => (value?.length ? value.join(', ') : '—');

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text fontWeight="600" mt={4} mb={2} color="gray.700" fontSize="md" borderBottom="1px solid" borderColor="gray.100" pb={1}>
    {children}
  </Text>
);

interface FamilyReviewConfirmProps {
  accordionIndex: number[];
  setAccordionIndex: (val: number[]) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (val: boolean) => void;
  captchaChecked: boolean;
  setCaptchaChecked: (val: boolean) => void;
  onBack?: () => void;
  primaryButtonStyles: any;
}

export function FamilyReviewConfirm({
  accordionIndex,
  setAccordionIndex,
  agreedToTerms,
  setAgreedToTerms,
  captchaChecked,
  setCaptchaChecked,
  onBack,
}: FamilyReviewConfirmProps) {
  const { t } = useTranslation();
  const { setStep } = useStepperContext();
  const { watch, setValue, register } = useFormContext();
  const formData = watch();

  const patient = formData.patientDetails || {};
  const you = formData.hcpDetails || {};

  return (
    <>
      <Heading as="h2" size="lg" mb={4} color="gray.800" fontWeight="600">
        {t('forms.patient.reviewConfirm.title')}
      </Heading>
      <Flex justify="flex-end" mb={4}>
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          onClick={() => setAccordionIndex([])}
        >
          {t('forms.patient.reviewConfirm.hideAll')}
        </Button>
      </Flex>

      <Accordion
        allowMultiple
        index={accordionIndex}
        onChange={(expanded) =>
          setAccordionIndex(Array.isArray(expanded) ? expanded : [expanded])
        }
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        overflow="hidden"
        mb={6}
      >
        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>{t('forms.shared.reviewConfirm.whoAreYouTitle')}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                onBack?.();
              }}
            >
              {t('forms.patient.common.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <Flex justify="space-between" py={2} borderBottom="1px solid" borderColor="gray.100">
              <Text color="gray.600">{t('forms.shared.reviewConfirm.iAmLabel')}</Text>
              <Text fontWeight="500">{t('welcome.roles.family')}</Text>
            </Flex>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>{t('forms.patient.productDetails.title')}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('product');
              }}
            >
              {t('forms.patient.common.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {(formData.products || []).map((p: any, index: number) => (
              <Box key={index} mb={index < formData.products.length - 1 ? 6 : 0}>
                {formData.products.length > 1 && <SectionTitle>{t('forms.patient.reviewConfirm.productNum', { num: index + 1 })}</SectionTitle>}
                <ReviewRow label={t('forms.patient.productDetails.productNameLabel')} value={v(p.productName)} />
                <ReviewRow label={t('forms.patient.productDetails.conditionLabel')} value={v(p.conditions?.[0]?.name)} />
                <ReviewRow label={t('forms.patient.productDetails.batchLotNumberLabel')} value={v(p.batches?.[0]?.batchNumber)} />
                <ReviewRow label={t('forms.patient.productDetails.expiryDateLabel')} value={v(p.batches?.[0]?.expiryDate)} />
                <ReviewRow label={t('forms.patient.productDetails.startDateLabel')} value={v(p.batches?.[0]?.startDate)} />
                <ReviewRow label={t('forms.patient.productDetails.endDateLabel')} value={v(p.batches?.[0]?.endDate)} />
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>{t('forms.patient.eventDetails.title')}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('event');
              }}
            >
              {t('forms.patient.common.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {(formData.symptoms || []).map((s: any, index: number) => (
              <Box key={index} mb={index < formData.symptoms.length - 1 ? 6 : 0}>
                {formData.symptoms.length > 1 && <SectionTitle>{t('forms.patient.eventDetails.symptomIndex', { num: index + 1 })}</SectionTitle>}
                <ReviewRow label={t('forms.patient.eventDetails.symptomLabel')} value={v(s.name)} />
                <ReviewRow label={t('forms.patient.eventDetails.startDateLabel')} value={v(s.eventStartDate)} />
                <ReviewRow label={t('forms.patient.eventDetails.endDateLabel')} value={v(s.eventEndDate)} />
                <ReviewRow label={t('forms.patient.eventDetails.treatedLabel')} value={v(s.symptomTreated)} />
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>{t('forms.patient.personalDetails.title')}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('patient');
              }}
            >
              {t('forms.patient.common.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label={t('forms.patient.personalDetails.initialsLabel')} value={v(patient.initials)} />
            <ReviewRow label={t('forms.patient.reviewConfirm.ageDob')} value={v(patient.ageValue || patient.dob)} />
            <ReviewRow label={t('forms.patient.personalDetails.sexLabel')} value={v(patient.gender)} />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>{t('forms.patient.personalDetails.reporterTitle')}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('you');
              }}
            >
              {t('forms.patient.common.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label={t('forms.patient.personalDetails.contactPermissionLabel')} value={v(you.contactPermission)} />
            <Text fontWeight="600" mt={3} mb={2} color="gray.700">
              {t('forms.patient.personalDetails.contactInfoTitle')}
            </Text>
            <ReviewRow label={t('forms.patient.personalDetails.nameLabel')} value={[v(you.firstName), v(you.lastName)].filter(x => x !== '—').join(' ') || '—'} />
            <ReviewRow label={t('forms.patient.personalDetails.emailLabel')} value={v(you.email)} />
            <ReviewRow label={t('forms.patient.personalDetails.phoneLabel')} value={v(you.phone)} />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Text>{t('forms.patient.additionalDetails.title')}</Text>
            <Button size="sm" variant="ghost" leftIcon={<span>✎</span>} onClick={(e) => { e.stopPropagation(); setStep('additional'); }}>{t('forms.patient.common.edit')}</Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {/* Other medications */}
            {(formData.otherMedications?.length > 0) ? (
              <>
                <SectionTitle>{t('forms.patient.reviewConfirm.otherMedsReviewTitle', { count: formData.otherMedications.length })}</SectionTitle>
                {formData.otherMedications.map((m: any, i: number) => (
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
            {(formData.medicalHistory?.length > 0) ? (
              <>
                <SectionTitle>{t('forms.patient.reviewConfirm.medicalHistoryReviewTitle', { count: formData.medicalHistory.length })}</SectionTitle>
                {formData.medicalHistory.map((h: any, i: number) => (
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
            {(formData.labTests?.length > 0) ? (
              <>
                <SectionTitle>{t('forms.patient.reviewConfirm.labTestsReviewTitle', { count: formData.labTests.length })}</SectionTitle>
                {formData.labTests.map((t: any, i: number) => (
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

            {/* Additional Info */}
            <SectionTitle>{t('forms.shared.reviewConfirm.otherInfoTitle')}</SectionTitle>
            <ReviewRow label={t('forms.shared.reviewConfirm.additionalDetailsLabel')} value={v(formData.additionalDetails)} />
            <ReviewRow label={t('forms.patient.additionalDetails.attachmentsLabel')} value={formData.attachments?.length ? t('forms.patient.reviewConfirm.filesUploaded', { count: formData.attachments.length }) : t('forms.patient.common.none')} />
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
