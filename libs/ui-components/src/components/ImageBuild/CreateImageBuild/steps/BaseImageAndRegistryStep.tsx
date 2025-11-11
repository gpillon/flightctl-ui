import * as React from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  FormGroup,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  TextInput,
} from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useAppContext } from '../../../../hooks/useAppContext';
import { getErrorMessage } from '../../../../utils/error';

export const baseImageAndRegistryStepId = 'base-image-and-registry-step';

export const isBaseImageAndRegistryStepValid = (errors: any, values: ImageBuildFormValues): boolean => {
  const baseImageValid = !errors.name && !errors.baseImage;
  if (!values.pushToRegistry) {
    return baseImageValid;
  }
  return baseImageValid && !errors.containerRegistry;
};

const SUGGESTED_BASE_IMAGES = [
  {
    value: 'quay.io/centos-bootc/centos-bootc:stream9',
    label: 'CentOS Stream 9',
    description: 'quay.io/centos-bootc/centos-bootc:stream9',
  },
  {
    value: 'quay.io/fedora/fedora-bootc:42',
    label: 'Fedora',
    description: 'quay.io/fedora/fedora-bootc:42',
  },
  {
    value: 'quay.io/centos-bootc/centos-bootc:stream10',
    label: 'CentOS Stream 10 (in development)',
    description: 'quay.io/centos-bootc/centos-bootc:stream10',
  },
  {
    value: 'registry.redhat.io/openshift4/microshift-bootc-rhel9:v4.20',
    label: 'MicroShift 4.20 on RHEL 9',
    description: 'registry.redhat.io/openshift4/microshift-bootc-rhel9:v4.20',
  },
  {
    value: 'registry.redhat.io/openshift4/microshift-bootc-rhel9:v4.19',
    label: 'MicroShift 4.19 on RHEL 9',
    description: 'registry.redhat.io/openshift4/microshift-bootc-rhel9:v4.19',
  },
  {
    value: 'registry.redhat.io/openshift4/microshift-bootc-rhel9:v4.18',
    label: 'MicroShift 4.18 on RHEL 9',
    description: 'registry.redhat.io/openshift4/microshift-bootc-rhel9:v4.18',
  },
];

type TestCredentialsStatus = 'idle' | 'testing' | 'success' | 'error';

const BaseImageAndRegistryStep = () => {
  const { t } = useTranslation();
  const { fetch: appFetch } = useAppContext();
  const { values, errors, touched, handleBlur, handleChange, setFieldValue } =
    useFormikContext<ImageBuildFormValues>();
  const [isBaseImageSelectOpen, setIsBaseImageSelectOpen] = React.useState(false);
  const [isCustomImage, setIsCustomImage] = React.useState(false);
  const [testBaseImageStatus, setTestBaseImageStatus] = React.useState<TestCredentialsStatus>('idle');
  const [testBaseImageError, setTestBaseImageError] = React.useState<string>('');
  const [testRegistryStatus, setTestRegistryStatus] = React.useState<TestCredentialsStatus>('idle');
  const [testRegistryError, setTestRegistryError] = React.useState<string>('');

  // Check if current value is one of the suggested images
  React.useEffect(() => {
    const isSuggested = SUGGESTED_BASE_IMAGES.some((img) => img.value === values.baseImage);
    setIsCustomImage(!isSuggested && values.baseImage !== '');
  }, [values.baseImage]);

  const handleBaseImageSelect = (value: string | undefined) => {
    if (value === 'custom') {
      setIsCustomImage(true);
      setFieldValue('baseImage', '');
    } else if (value) {
      setIsCustomImage(false);
      setFieldValue('baseImage', value);
    }
    setIsBaseImageSelectOpen(false);
  };

  const selectedBaseImageLabel = isCustomImage
    ? t('Custom image')
    : SUGGESTED_BASE_IMAGES.find((img) => img.value === values.baseImage)?.label || t('Select base image');

  const testBaseImageCredentials = async () => {
    setTestBaseImageStatus('testing');
    setTestBaseImageError('');

    try {
      const response = await appFetch.proxyFetch('builder/v1/test-registry-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url: values.baseImage,
          username: values.baseImageRegistryCredentials?.username || '',
          password: values.baseImageRegistryCredentials?.password || '',
          skipTLSVerify: values.baseImageRegistryCredentials?.skipTLSVerify || false,
        }),
      });

      if (!response.ok) {
        setTestBaseImageStatus('error');
        setTestBaseImageError(t('Failed to test credentials: {{status}}', { status: response.statusText }));
        return;
      }

      const data = await response.json();

      if (data.success) {
        setTestBaseImageStatus('success');
      } else {
        setTestBaseImageStatus('error');
        setTestBaseImageError(data.message || t('Failed to connect to registry'));
      }
    } catch (error) {
      setTestBaseImageStatus('error');
      setTestBaseImageError(getErrorMessage(error));
    }
  };

  const testRegistryCredentials = async () => {
    setTestRegistryStatus('testing');
    setTestRegistryError('');

    if (!values.containerRegistry.url) {
      setTestRegistryStatus('error');
      setTestRegistryError(t('Registry URL is required'));
      return;
    }

    try {
      const response = await appFetch.proxyFetch('builder/v1/test-registry-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url: values.containerRegistry.url,
          username: values.containerRegistry.username || '',
          password: values.containerRegistry.password || '',
          skipTLSVerify: false,
        }),
      });

      if (!response.ok) {
        setTestRegistryStatus('error');
        setTestRegistryError(t('Failed to test credentials: {{status}}', { status: response.statusText }));
        return;
      }

      const data = await response.json();

      if (data.success) {
        setTestRegistryStatus('success');
      } else {
        setTestRegistryStatus('error');
        setTestRegistryError(data.message || t('Failed to connect to registry'));
      }
    } catch (error) {
      setTestRegistryStatus('error');
      setTestRegistryError(getErrorMessage(error));
    }
  };

  const getTestButtonContent = (status: TestCredentialsStatus, isRegistry: boolean = false) => {
    switch (status) {
      case 'testing':
        return (
          <>
            <Spinner size="sm" style={{ marginRight: '8px' }} />
            {t('Testing...')}
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircleIcon color="var(--pf-v5-global--success-color--100)" style={{ marginRight: '8px' }} />
            {t('Connection successful')}
          </>
        );
      case 'error':
        return (
          <>
            <ExclamationCircleIcon color="var(--pf-v5-global--danger-color--100)" style={{ marginRight: '8px' }} />
            {t('Test failed')}
          </>
        );
      default:
        return t(isRegistry ? 'Test registry connection' : 'Test base image access');
    }
  };

  return (
    <>
      {/* Base Image Section */}
      <FormGroup
        label={t('Build name')}
        isRequired
        fieldId="name"
      >
        <TextInput
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={t('my-custom-image')}
        />
        {touched.name && errors.name && (
          <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: 'var(--pf-v5-global--FontSize--sm)' }}>
            {errors.name}
          </div>
        )}
      </FormGroup>

      <FormGroup
        label={t('Base image')}
        isRequired
        fieldId="baseImage"
      >
        <Select
          id="baseImage-select"
          isOpen={isBaseImageSelectOpen}
          selected={isCustomImage ? 'custom' : values.baseImage}
          onSelect={(_, value) => handleBaseImageSelect(value as string)}
          onOpenChange={(isOpen) => setIsBaseImageSelectOpen(isOpen)}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setIsBaseImageSelectOpen(!isBaseImageSelectOpen)}
              isExpanded={isBaseImageSelectOpen}
              isFullWidth
            >
              {selectedBaseImageLabel}
            </MenuToggle>
          )}
        >
          <SelectList>
            {SUGGESTED_BASE_IMAGES.map((image) => (
              <SelectOption key={image.value} value={image.value} description={image.description}>
                {image.label}
              </SelectOption>
            ))}
            <SelectOption key="custom" value="custom">
              {t('Custom image')}
            </SelectOption>
          </SelectList>
        </Select>
        {isCustomImage && (
          <TextInput
            id="baseImage"
            name="baseImage"
            value={values.baseImage}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('quay.io/fedora/fedora-bootc:latest')}
            style={{ marginTop: '8px' }}
          />
        )}
        {touched.baseImage && errors.baseImage && (
          <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: 'var(--pf-v5-global--FontSize--sm)' }}>
            {errors.baseImage}
          </div>
        )}
      </FormGroup>

      <FormGroup
        label={t('Base image registry credentials (optional)')}
        fieldId="baseImageRegistryCredentials"
      >
        <FormGroup label={t('Username')} fieldId="registryUsername">
          <TextInput
            id="registryUsername"
            name="baseImageRegistryCredentials.username"
            value={values.baseImageRegistryCredentials?.username || ''}
            onChange={(e) => {
              handleChange(e);
              setTestBaseImageStatus('idle');
            }}
            onBlur={handleBlur}
            placeholder={t('Registry username')}
          />
        </FormGroup>
        <FormGroup label={t('Password')} fieldId="registryPassword">
          <TextInput
            id="registryPassword"
            name="baseImageRegistryCredentials.password"
            type="password"
            value={values.baseImageRegistryCredentials?.password || ''}
            onChange={(e) => {
              handleChange(e);
              setTestBaseImageStatus('idle');
            }}
            onBlur={handleBlur}
            placeholder={t('Registry password')}
          />
        </FormGroup>
        <Checkbox
          id="skipTLSVerify"
          label={t('Skip TLS verification')}
          isChecked={values.baseImageRegistryCredentials?.skipTLSVerify || false}
          onChange={(_, checked) => setFieldValue('baseImageRegistryCredentials.skipTLSVerify', checked)}
        />
        {values.baseImage && (
          <>
            <Button
              variant="secondary"
              onClick={testBaseImageCredentials}
              isDisabled={testBaseImageStatus === 'testing'}
              style={{ marginTop: '8px' }}
            >
              {getTestButtonContent(testBaseImageStatus, false)}
            </Button>
            {testBaseImageStatus === 'error' && testBaseImageError && (
              <Alert variant="danger" isInline title={t('Test failed')} style={{ marginTop: '8px' }}>
                {testBaseImageError}
              </Alert>
            )}
            {testBaseImageStatus === 'success' && (
              <Alert variant="success" isInline title={t('Success')} style={{ marginTop: '8px' }}>
                {t('Base image is accessible from this registry.')}
              </Alert>
            )}
          </>
        )}
      </FormGroup>

      <Divider style={{ margin: '24px 0' }} />

      {/* Container Registry Section */}
      <FormGroup fieldId="pushToRegistry">
        <Checkbox
          id="pushToRegistry"
          name="pushToRegistry"
          label={t('Push image to container registry after build')}
          isChecked={values.pushToRegistry}
          onChange={(_, checked) => setFieldValue('pushToRegistry', checked)}
        />
      </FormGroup>

      {values.pushToRegistry && (
        <>
          <Alert
            variant="info"
            isInline
            title={t('Output registry configuration')}
            style={{ marginBottom: '16px' }}
          >
            {t('Configure the registry where the built image will be pushed.')}
          </Alert>

          <FormGroup
            label={t('Registry URL')}
            isRequired
            fieldId="containerRegistry.url"
          >
            <TextInput
              id="containerRegistry.url"
              name="containerRegistry.url"
              value={values.containerRegistry.url}
              onChange={(e) => {
                handleChange(e);
                setTestRegistryStatus('idle');
              }}
              onBlur={handleBlur}
              placeholder={t('quay.io/myorg/myimage')}
            />
            {touched.containerRegistry?.url && errors.containerRegistry?.url && (
              <div style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: 'var(--pf-v5-global--FontSize--sm)' }}>
                {errors.containerRegistry.url}
              </div>
            )}
          </FormGroup>

          <FormGroup
            label={t('Username')}
            fieldId="containerRegistry.username"
          >
            <TextInput
              id="containerRegistry.username"
              name="containerRegistry.username"
              value={values.containerRegistry.username || ''}
              onChange={(e) => {
                handleChange(e);
                setTestRegistryStatus('idle');
              }}
              onBlur={handleBlur}
              placeholder={t('username')}
            />
          </FormGroup>

          <FormGroup
            label={t('Password')}
            fieldId="containerRegistry.password"
          >
            <TextInput
              id="containerRegistry.password"
              name="containerRegistry.password"
              type="password"
              value={values.containerRegistry.password || ''}
              onChange={(e) => {
                handleChange(e);
                setTestRegistryStatus('idle');
              }}
              onBlur={handleBlur}
              placeholder={t('password')}
            />
          </FormGroup>

          <Button
            variant="secondary"
            onClick={testRegistryCredentials}
            isDisabled={testRegistryStatus === 'testing' || !values.containerRegistry.url}
            style={{ marginTop: '8px' }}
          >
            {getTestButtonContent(testRegistryStatus, true)}
          </Button>
          {testRegistryStatus === 'error' && testRegistryError && (
            <Alert variant="danger" isInline title={t('Test failed')} style={{ marginTop: '8px' }}>
              {testRegistryError}
            </Alert>
          )}
          {testRegistryStatus === 'success' && (
            <Alert variant="success" isInline title={t('Success')} style={{ marginTop: '8px' }}>
              {t('Registry credentials are valid and connection is working.')}
            </Alert>
          )}
        </>
      )}
    </>
  );
};

export default BaseImageAndRegistryStep;

