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
        {value || '—'}
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

interface HcpReviewConfirmProps {
  accordionIndex: number[];
  setAccordionIndex: (val: number[]) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (val: boolean) => void;
  captchaChecked: boolean;
  setCaptchaChecked: (val: boolean) => void;
  onBack?: () => void;
  primaryButtonStyles: any;
}

export function HcpReviewConfirm({
  accordionIndex,
  setAccordionIndex,
  agreedToTerms,
  setAgreedToTerms,
  captchaChecked,
  setCaptchaChecked,
  onBack,
}: HcpReviewConfirmProps) {
  const { t } = useTranslation();
  const { setStep } = useStepperContext();
  const { watch, setValue, register } = useFormContext();
  const formData = watch();

  return (
    <>
      <Heading as="h2" size="lg" mb={4} color="gray.800" fontWeight="600">
        {t('forms.hcp.reviewConfirm.title')}
      </Heading>
      <Flex justify="flex-end" mb={4}>
        <Button
          variant="ghost"
          size="sm"
          color="gray.600"
          onClick={() => setAccordionIndex([])}
        >
          {t('forms.hcp.reviewConfirm.hideAll')}
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
            <Text>{t('forms.hcp.reviewConfirm.sections.whoAreYou')}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                onBack?.();
              }}
            >
              {t('forms.hcp.reviewConfirm.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <Flex justify="space-between" py={2} borderBottom="1px solid" borderColor="gray.100">
              <Text color="gray.600">{t('forms.hcp.reviewConfirm.labels.iam')}</Text>
              <Text fontWeight="500">{t('forms.hcp.reviewConfirm.labels.hcp')}</Text>
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
            <Text>
              {t('forms.hcp.reviewConfirm.sections.productDetails')}{' '}
              {formData.products?.length > 1 && t('forms.hcp.reviewConfirm.sections.productsCount', { count: formData.products.length })}
            </Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('product');
              }}
            >
              {t('forms.hcp.reviewConfirm.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {(formData.products || []).map((p: any, index: number) => (
              <Box key={index} mb={index < formData.products.length - 1 ? 6 : 0}>
                {formData.products.length > 1 && <SectionTitle>{t('forms.patient.additionalDetails.productIndex', { index: index + 1 })}</SectionTitle>}
                <ReviewRow label={t('forms.hcp.reviewConfirm.labels.productName')} value={v(p.productName)} />
                <ReviewRow label={t('forms.hcp.reviewConfirm.labels.condition')} value={v(p.conditions?.[0]?.name)} />
                <ReviewRow label={t('forms.hcp.reviewConfirm.labels.batchNumber')} value={v(p.batches?.[0]?.batchNumber)} />
                <ReviewRow label={t('forms.hcp.reviewConfirm.labels.doseForm')} value={v(p.doseForm)} />
                <ReviewRow label={t('forms.hcp.reviewConfirm.labels.route')} value={v(p.route)} />
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
            <Text>
              {t('forms.hcp.reviewConfirm.sections.eventDetails')}{' '}
              {formData.symptoms?.length > 1 && t('forms.hcp.reviewConfirm.sections.symptomsCount', { count: formData.symptoms.length })}
            </Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('event');
              }}
            >
              {t('forms.hcp.reviewConfirm.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {(formData.symptoms || []).map((s: any, index: number) => (
              <Box key={index} mb={index < formData.symptoms.length - 1 ? 6 : 0}>
                {formData.symptoms.length > 1 && <SectionTitle>{t('forms.patient.eventDetails.symptomIndex', { index: index + 1 })}</SectionTitle>}
                <ReviewRow label={t('forms.hcp.reviewConfirm.labels.symptom')} value={v(s.name)} />
                <ReviewRow 
                  label={t('forms.hcp.reviewConfirm.labels.dates')} 
                  value={(s.eventStartDate || s.eventEndDate) ? `${s.eventStartDate || '?'} to ${s.eventEndDate || t('forms.patient.common.ongoing')}` : '—'} 
                />
                <ReviewRow label={t('forms.hcp.reviewConfirm.labels.relationship')} value={v(s.relationship)} />
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
            <Text>{t('forms.hcp.reviewConfirm.sections.patientDetails')}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('patient');
              }}
            >
              {t('forms.hcp.reviewConfirm.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.patientInitials')} value={v(formData.patientInitials)} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.ageDob')} value={v(formData.age || formData.dob)} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.sex')} value={v(formData.gender)} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.height')} value={v(formData.height)} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.weight')} value={v(formData.weight)} />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton
            fontWeight="600"
            color="gray.800"
            _expanded={{ bg: 'gray.50' }}
            justifyContent="space-between"
          >
            <Text>{t('forms.hcp.reviewConfirm.sections.reporterInfo')}</Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<span>✎</span>}
              onClick={(e) => {
                e.stopPropagation();
                setStep('you');
              }}
            >
              {t('forms.hcp.reviewConfirm.edit')}
            </Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.name')} value={[v(formData.firstName), v(formData.lastName)].filter(x => x !== '—').join(' ') || '—'} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.institution')} value={v(formData.institution)} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.email')} value={v(formData.email)} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.phone')} value={v(formData.phone)} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.address')} value={[v(formData.address), v(formData.city), v(formData.state), v(formData.country)].filter(x => x !== '—').join(', ') || '—'} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.contactPermission')} value={v(formData.contactPermission)} />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton fontWeight="600" color="gray.800" _expanded={{ bg: 'gray.50' }} justifyContent="space-between">
            <Text>{t('forms.hcp.reviewConfirm.sections.additionalDetails')}</Text>
            <Button size="sm" variant="ghost" leftIcon={<span>✎</span>} onClick={(e) => { e.stopPropagation(); setStep('additional'); }}>{t('forms.hcp.reviewConfirm.edit')}</Button>
          </AccordionButton>
          <AccordionPanel pb={4} bg="white">
            {/* Other medications */}
            {(formData.otherMedications?.length > 0) ? (
              <>
                <SectionTitle>{t('forms.hcp.reviewConfirm.labels.otherMedicationsCount', { count: formData.otherMedications.length })}</SectionTitle>
                {formData.otherMedications.map((m: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={t('forms.patient.additionalDetails.medicationIndex', { index: i + 1 })} value={v(m?.product)} />
                    <ReviewRow label={t('forms.hcp.reviewConfirm.labels.condition')} value={v(m?.condition)} />
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label={t('forms.hcp.reviewConfirm.labels.otherMedications')} value={t('forms.patient.common.none')} />
            )}

            {/* Medical history */}
            {(formData.medicalHistory?.length > 0) ? (
              <>
                <SectionTitle>{t('forms.hcp.reviewConfirm.labels.medicalHistoryCount', { count: formData.medicalHistory.length })}</SectionTitle>
                {formData.medicalHistory.map((h: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={t('forms.patient.additionalDetails.historyIndex', { index: i + 1 })} value={v(h?.conditionName)} />
                    {h?.info && <ReviewRow label={t('forms.hcp.reviewConfirm.labels.additionalInfo')} value={v(h?.info)} />}
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label={t('forms.hcp.reviewConfirm.labels.medicalHistory')} value={t('forms.patient.common.none')} />
            )}

            {/* Lab tests */}
            {(formData.labTests?.length > 0) ? (
              <>
                <SectionTitle>{t('forms.hcp.reviewConfirm.labels.labTestsCount', { count: formData.labTests.length })}</SectionTitle>
                {formData.labTests.map((t_item: any, i: number) => (
                  <Box key={i} mb={2}>
                    <ReviewRow label={t('forms.patient.additionalDetails.testIndex', { index: i + 1 })} value={v(t_item?.testName)} />
                    <ReviewRow label={t('forms.hcp.reviewConfirm.labels.testResult')} value={[v(t_item?.testQualifier), v(t_item?.testValue)].filter(x => x !== '—').join(' ') || '—'} />
                    {t_item?.outcome?.length > 0 && <ReviewRow label={t('forms.hcp.reviewConfirm.labels.outcome')} value={arr(t_item?.outcome)} />}
                    {t_item?.testComments && <ReviewRow label={t('forms.hcp.reviewConfirm.labels.comments')} value={v(t_item?.testComments)} />}
                  </Box>
                ))}
              </>
            ) : (
              <ReviewRow label={t('forms.hcp.reviewConfirm.labels.labTests')} value={t('forms.patient.common.none')} />
            )}

            {/* Additional Info */}
            <SectionTitle>{t('forms.hcp.reviewConfirm.sections.otherInformation')}</SectionTitle>
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.additionalDetails')} value={v(formData.additionalDetails)} />
            <ReviewRow label={t('forms.hcp.reviewConfirm.labels.attachments')} value={formData.attachments?.length ? t('forms.hcp.reviewConfirm.labels.filesCount', { count: formData.attachments.length }) : t('forms.patient.common.none')} />
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
            reCAPTCHA site key missing. Add <strong>VITE_RECAPTCHA_SITE_KEY</strong> to <code>frontend/.env</code>
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
            i18nKey="forms.hcp.reviewConfirm.terms.agreeLabel"
            values={{
              privacy: t('forms.hcp.reviewConfirm.terms.privacy'),
              terms: t('forms.hcp.reviewConfirm.terms.terms')
            }}
            components={{
              privacy: (
                <Link
                  href="https://www.takeda.com/privacy-notice/"
                  isExternal
                  color="#CE0037"
                  textDecoration="underline"
                />
              ),
              terms: (
                <Link
                  href="https://www.takeda.com/terms-and-conditions/"
                  isExternal
                  color="#CE0037"
                  textDecoration="underline"
                />
              )
            }}
          />
        </Checkbox>
      </Box>

      {(!agreedToTerms || !captchaChecked) && (
        <Text fontSize="xs" color="red.400" mb={2}>
          {!captchaChecked && !agreedToTerms
            ? t('forms.hcp.reviewConfirm.terms.captchaError')
            : !captchaChecked
            ? t('forms.hcp.reviewConfirm.terms.captchaOnly')
            : t('forms.hcp.reviewConfirm.terms.termsOnly')}
        </Text>
      )}
    </>
  );
}
