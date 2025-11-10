import * as React from 'react';
import {
  Button,
  Form,
  FormGroup,
  FormSection,
  TextInput,
  TextArea,
  Checkbox,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Title,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Divider,
  Select,
  SelectOption,
  MenuToggle,
  SelectList,
  Alert,
} from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const flightCtlConfigStepId = 'flightctl-config-step';

export const isFlightCtlConfigStepValid = (errors: any): boolean => {
  return !errors.flightctlConfig;
};

const LOG_LEVELS = [
  { value: 'panic', label: 'Panic' },
  { value: 'fatal', label: 'Fatal' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
  { value: 'trace', label: 'Trace' },
];

const AVAILABLE_SYSTEM_INFO = [
  'hostname',
  'kernel',
  'distroName',
  'distroVersion',
  'productName',
  'productSerial',
  'productUuid',
  'biosVendor',
  'biosVersion',
  'netInterfaceDefault',
  'netIpDefault',
  'netMacDefault',
  'gpu',
  'memoryTotalKb',
  'cpuCores',
  'cpuProcessors',
  'cpuModel',
];

const FlightCtlConfigStep = () => {
  const { t } = useTranslation();
  const { values, setFieldValue, errors, touched } = useFormikContext<ImageBuildFormValues>();
  const [logLevelOpen, setLogLevelOpen] = React.useState(false);

  const addDefaultLabel = () => {
    const newKey = `label${Object.keys(values.flightctlConfig.defaultLabels).length + 1}`;
    setFieldValue(`flightctlConfig.defaultLabels.${newKey}`, '');
  };

  const removeDefaultLabel = (key: string) => {
    const newLabels = { ...values.flightctlConfig.defaultLabels };
    delete newLabels[key];
    setFieldValue('flightctlConfig.defaultLabels', newLabels);
  };

  const updateDefaultLabelKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const newLabels = { ...values.flightctlConfig.defaultLabels };
    const value = newLabels[oldKey];
    delete newLabels[oldKey];
    newLabels[newKey] = value;
    setFieldValue('flightctlConfig.defaultLabels', newLabels);
  };

  const addSystemInfoCustom = () => {
    setFieldValue('flightctlConfig.systemInfoCustom', [...values.flightctlConfig.systemInfoCustom, '']);
  };

  const removeSystemInfoCustom = (index: number) => {
    const newItems = values.flightctlConfig.systemInfoCustom.filter((_, i) => i !== index);
    setFieldValue('flightctlConfig.systemInfoCustom', newItems);
  };

  const updateSystemInfoCustom = (index: number, value: string) => {
    const newItems = [...values.flightctlConfig.systemInfoCustom];
    newItems[index] = value;
    setFieldValue('flightctlConfig.systemInfoCustom', newItems);
  };

  const toggleSystemInfo = (info: string) => {
    const currentValues = values.flightctlConfig.systemInfo;
    if (currentValues.includes(info)) {
      setFieldValue(
        'flightctlConfig.systemInfo',
        currentValues.filter((v) => v !== info),
      );
    } else {
      setFieldValue('flightctlConfig.systemInfo', [...currentValues, info]);
    }
  };

  return (
    <Form>
      <Stack hasGutter>
        {/* Enrollment Service Section - Optional */}
        <StackItem>
          <FormSection>
            <Checkbox
              id="override-enrollment-service"
              label={t('Override Enrollment Service')}
              description={t(
                'Enable this to manually configure enrollment service credentials. Typically, this is set automatically during deployment.',
              )}
              isChecked={values.flightctlConfig.overrideEnrollmentService}
              onChange={(_, checked) => setFieldValue('flightctlConfig.overrideEnrollmentService', checked)}
            />
          </FormSection>
        </StackItem>

        {values.flightctlConfig.overrideEnrollmentService && (
          <StackItem>
            <Alert
              variant="warning"
              isInline
              title={t('Advanced Configuration')}
              style={{ marginBottom: '16px' }}
            >
              {t(
                'The enrollment service configuration is typically generated automatically using "flightctl certificate request". Manual configuration may prevent devices from enrolling correctly.',
              )}
            </Alert>
            <FormSection>
              <Title headingLevel="h2" size="xl">
                {t('Enrollment Service Credentials')}
              </Title>
              <Grid hasGutter md={6}>
                <GridItem>
                  <FormGroup label={t('Server')} isRequired fieldId="enrollment-server">
                    <TextInput
                      id="enrollment-server"
                      value={values.flightctlConfig.enrollmentService.server}
                      onChange={(_, value) => setFieldValue('flightctlConfig.enrollmentService.server', value)}
                      placeholder="https://agent-api.example.com/"
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>{t('The URL of the FlightCtl agent API server')}</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>
                </GridItem>
                <GridItem>
                  <FormGroup label={t('Enrollment UI Endpoint')} isRequired fieldId="enrollment-ui-endpoint">
                    <TextInput
                      id="enrollment-ui-endpoint"
                      value={values.flightctlConfig.enrollmentService.enrollmentUiEndpoint}
                      onChange={(_, value) =>
                        setFieldValue('flightctlConfig.enrollmentService.enrollmentUiEndpoint', value)
                      }
                      placeholder="http://ui.example.com"
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>{t('URL for device enrollment UI')}</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>
                </GridItem>
                <GridItem span={12}>
                  <FormGroup
                    label={t('Certificate Authority Data')}
                    isRequired
                    fieldId="certificate-authority-data"
                  >
                    <TextArea
                      id="certificate-authority-data"
                      value={values.flightctlConfig.enrollmentService.certificateAuthorityData}
                      onChange={(_, value) =>
                        setFieldValue('flightctlConfig.enrollmentService.certificateAuthorityData', value)
                      }
                      placeholder="LS0tLS1CRUdJTi..."
                      rows={5}
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>{t('Base64-encoded CA certificate data')}</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>
                </GridItem>
                <GridItem span={12}>
                  <FormGroup
                    label={t('Client Certificate Data')}
                    isRequired
                    fieldId="client-certificate-data"
                  >
                    <TextArea
                      id="client-certificate-data"
                      value={values.flightctlConfig.enrollmentService.clientCertificateData}
                      onChange={(_, value) =>
                        setFieldValue('flightctlConfig.enrollmentService.clientCertificateData', value)
                      }
                      placeholder="LS0tLS1CRUdJTi..."
                      rows={5}
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>{t('Base64-encoded client certificate data')}</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>
                </GridItem>
                <GridItem span={12}>
                  <FormGroup label={t('Client Key Data')} isRequired fieldId="client-key-data">
                    <TextArea
                      id="client-key-data"
                      value={values.flightctlConfig.enrollmentService.clientKeyData}
                      onChange={(_, value) =>
                        setFieldValue('flightctlConfig.enrollmentService.clientKeyData', value)
                      }
                      placeholder="LS0tLS1CRUdJTi..."
                      rows={5}
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>{t('Base64-encoded client key data')}</HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>
                </GridItem>
              </Grid>
            </FormSection>
          </StackItem>
        )}

        <Divider />

        {/* Agent Configuration Section */}
        <StackItem>
          <FormSection>
            <Title headingLevel="h2" size="xl">
              {t('Agent Configuration')}
            </Title>
            <Grid hasGutter md={6}>
              <GridItem>
                <FormGroup label={t('Spec Fetch Interval')} fieldId="spec-fetch-interval">
                  <TextInput
                    id="spec-fetch-interval"
                    value={values.flightctlConfig.specFetchInterval}
                    onChange={(_, value) => setFieldValue('flightctlConfig.specFetchInterval', value)}
                    placeholder="60s"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        {t('Interval for polling device spec updates (e.g., 60s, 5m). Default: 60s')}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </GridItem>
              <GridItem>
                <FormGroup label={t('Status Update Interval')} fieldId="status-update-interval">
                  <TextInput
                    id="status-update-interval"
                    value={values.flightctlConfig.statusUpdateInterval}
                    onChange={(_, value) => setFieldValue('flightctlConfig.statusUpdateInterval', value)}
                    placeholder="60s"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        {t('Interval for sending device status updates (e.g., 60s, 5m). Default: 60s')}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </GridItem>
              <GridItem>
                <FormGroup label={t('System Info Timeout')} fieldId="system-info-timeout">
                  <TextInput
                    id="system-info-timeout"
                    value={values.flightctlConfig.systemInfoTimeout}
                    onChange={(_, value) => setFieldValue('flightctlConfig.systemInfoTimeout', value)}
                    placeholder="2m"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        {t('Timeout for collecting system info (max: 2m). Default: 2m')}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </GridItem>
              <GridItem>
                <FormGroup label={t('Pull Timeout')} fieldId="pull-timeout">
                  <TextInput
                    id="pull-timeout"
                    value={values.flightctlConfig.pullTimeout}
                    onChange={(_, value) => setFieldValue('flightctlConfig.pullTimeout', value)}
                    placeholder="10m"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        {t('Timeout for pulling a single OCI target (e.g., 10m). Default: 10m')}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </GridItem>
              <GridItem>
                <FormGroup label={t('Log Level')} fieldId="log-level">
                  <Select
                    selected={values.flightctlConfig.logLevel}
                    onSelect={(_, value) => {
                      setFieldValue('flightctlConfig.logLevel', value as string);
                      setLogLevelOpen(false);
                    }}
                    isOpen={logLevelOpen}
                    onOpenChange={setLogLevelOpen}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setLogLevelOpen(!logLevelOpen)}
                        isExpanded={logLevelOpen}
                      >
                        {LOG_LEVELS.find((l) => l.value === values.flightctlConfig.logLevel)?.label ||
                          t('Select log level')}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {LOG_LEVELS.map((level) => (
                        <SelectOption key={level.value} value={level.value}>
                          {level.label}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>{t('Logging level for the agent. Default: info')}</HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </GridItem>
            </Grid>
          </FormSection>
        </StackItem>

        <Divider />

        {/* Default Labels Section */}
        <StackItem>
          <FormSection>
            <Title headingLevel="h2" size="xl">
              {t('Default Labels')}
            </Title>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>{t('Labels automatically applied to the device during enrollment')}</HelperTextItem>
              </HelperText>
            </FormHelperText>
            <Stack hasGutter>
              {Object.entries(values.flightctlConfig.defaultLabels).map(([key, value]) => (
                <StackItem key={key}>
                  <Grid hasGutter md={6}>
                    <GridItem span={5}>
                      <TextInput
                        value={key}
                        onChange={(_, newKey) => updateDefaultLabelKey(key, newKey)}
                        placeholder={t('Key')}
                      />
                    </GridItem>
                    <GridItem span={5}>
                      <TextInput
                        value={value}
                        onChange={(_, newValue) =>
                          setFieldValue(`flightctlConfig.defaultLabels.${key}`, newValue)
                        }
                        placeholder={t('Value')}
                      />
                    </GridItem>
                    <GridItem span={2}>
                      <Button
                        variant="plain"
                        icon={<MinusCircleIcon />}
                        onClick={() => removeDefaultLabel(key)}
                        aria-label={t('Remove label')}
                      />
                    </GridItem>
                  </Grid>
                </StackItem>
              ))}
              <StackItem>
                <Button variant="link" icon={<PlusCircleIcon />} onClick={addDefaultLabel}>
                  {t('Add label')}
                </Button>
              </StackItem>
            </Stack>
          </FormSection>
        </StackItem>

        <Divider />

        {/* System Info Section */}
        <StackItem>
          <FormSection>
            <Title headingLevel="h2" size="xl">
              {t('System Information')}
            </Title>
            <FormGroup label={t('Built-in System Info Collectors')} fieldId="system-info">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {AVAILABLE_SYSTEM_INFO.map((info) => (
                  <Checkbox
                    key={info}
                    id={`system-info-${info}`}
                    label={info}
                    isChecked={values.flightctlConfig.systemInfo.includes(info)}
                    onChange={(_, checked) => toggleSystemInfo(info)}
                  />
                ))}
              </div>
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>
                    {t('{{count}} selected', { count: values.flightctlConfig.systemInfo.length })}
                  </HelperTextItem>
                  <HelperTextItem>{t('System information to collect from built-in collectors')}</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label={t('Custom System Info Collectors')} fieldId="system-info-custom">
              <Stack hasGutter>
                {values.flightctlConfig.systemInfoCustom.map((customInfo, index) => (
                  <StackItem key={index}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <TextInput
                        id={`system-info-custom-${index}`}
                        value={customInfo}
                        onChange={(_, value) => updateSystemInfoCustom(index, value)}
                        placeholder={t('Custom collector name')}
                        style={{ flex: 1 }}
                      />
                      <Button
                        variant="plain"
                        icon={<MinusCircleIcon />}
                        onClick={() => removeSystemInfoCustom(index)}
                        aria-label={t('Remove custom collector')}
                      />
                    </div>
                  </StackItem>
                ))}
                <StackItem>
                  <Button variant="link" icon={<PlusCircleIcon />} onClick={addSystemInfoCustom}>
                    {t('Add custom collector')}
                  </Button>
                </StackItem>
              </Stack>
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>
                    {t('Custom system info collectors from /usr/lib/flightctl/custom-info.d/')}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          </FormSection>
        </StackItem>

        <Divider />

        {/* TPM Configuration Section */}
        <StackItem>
          <FormSection>
            <Title headingLevel="h2" size="xl">
              {t('TPM Configuration')}
            </Title>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('Configure TPM 2.0 for hardware-based device identity and authentication')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
            <Grid hasGutter md={6}>
              <GridItem>
                <FormGroup fieldId="tpm-enabled">
                  <Checkbox
                    id="tpm-enabled"
                    label={t('Enable TPM')}
                    isChecked={values.flightctlConfig.tpm.enabled}
                    onChange={(_, checked) => setFieldValue('flightctlConfig.tpm.enabled', checked)}
                  />
                </FormGroup>
              </GridItem>
              <GridItem>
                <FormGroup label={t('TPM Device Path')} fieldId="tpm-device-path">
                  <TextInput
                    id="tpm-device-path"
                    value={values.flightctlConfig.tpm.devicePath}
                    onChange={(_, value) => setFieldValue('flightctlConfig.tpm.devicePath', value)}
                    placeholder="/dev/tpm0"
                    isDisabled={!values.flightctlConfig.tpm.enabled}
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        {t('Path to TPM device (leave empty for auto-discovery). Default: /dev/tpm0')}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </GridItem>
              <GridItem>
                <FormGroup label={t('TPM Storage File Path')} fieldId="tpm-storage-path">
                  <TextInput
                    id="tpm-storage-path"
                    value={values.flightctlConfig.tpm.storageFilePath}
                    onChange={(_, value) => setFieldValue('flightctlConfig.tpm.storageFilePath', value)}
                    placeholder="/var/lib/flightctl/tpm-blob.yaml"
                    isDisabled={!values.flightctlConfig.tpm.enabled}
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        {t('File path for TPM key persistence. Default: /var/lib/flightctl/tpm-blob.yaml')}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </GridItem>
              <GridItem>
                <FormGroup fieldId="tpm-auth-enabled">
                  <Checkbox
                    id="tpm-auth-enabled"
                    label={t('Enable TPM Password Authentication')}
                    isChecked={values.flightctlConfig.tpm.authEnabled}
                    onChange={(_, checked) => setFieldValue('flightctlConfig.tpm.authEnabled', checked)}
                    isDisabled={!values.flightctlConfig.tpm.enabled}
                    description={t(
                      'WARNING: Only use in ephemeral development environments. Generates random password for TPM ownership.',
                    )}
                  />
                </FormGroup>
              </GridItem>
            </Grid>
          </FormSection>
        </StackItem>
      </Stack>
    </Form>
  );
};

export default FlightCtlConfigStep;
