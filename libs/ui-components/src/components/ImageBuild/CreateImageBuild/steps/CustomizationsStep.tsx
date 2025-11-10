import * as React from 'react';
import {
  Button,
  FormGroup,
  TextInput,
  TextArea,
  Stack,
  StackItem,
  Title,
  FormSection,
  ChipGroup,
  Chip,
  Checkbox,
} from '@patternfly/react-core';
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const customizationsStepId = 'customizations-step';

export const isCustomizationsStepValid = (errors: any): boolean => {
  return !errors.customizations;
};

const CustomizationsStep = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ImageBuildFormValues>();

  const addPackage = () => {
    setFieldValue('customizations.packages', [...values.customizations.packages, '']);
  };

  const removePackage = (index: number) => {
    const newPackages = values.customizations.packages.filter((_, i) => i !== index);
    setFieldValue('customizations.packages', newPackages);
  };

  const updatePackage = (index: number, value: string) => {
    const newPackages = [...values.customizations.packages];
    newPackages[index] = value;
    setFieldValue('customizations.packages', newPackages);
  };

  const addFile = () => {
    setFieldValue('customizations.files', [...values.customizations.files, { path: '', content: '' }]);
  };

  const removeFile = (index: number) => {
    const newFiles = values.customizations.files.filter((_, i) => i !== index);
    setFieldValue('customizations.files', newFiles);
  };

  const updateFile = (index: number, field: 'path' | 'content' | 'mode' | 'user' | 'group', value: string) => {
    const newFiles = [...values.customizations.files];
    newFiles[index] = { ...newFiles[index], [field]: value };
    setFieldValue('customizations.files', newFiles);
  };

  const addScript = () => {
    setFieldValue('customizations.scripts', [...values.customizations.scripts, { path: '', content: '' }]);
  };

  const removeScript = (index: number) => {
    const newScripts = values.customizations.scripts.filter((_, i) => i !== index);
    setFieldValue('customizations.scripts', newScripts);
  };

  const updateScript = (index: number, field: 'path' | 'content', value: string) => {
    const newScripts = [...values.customizations.scripts];
    newScripts[index] = { ...newScripts[index], [field]: value };
    setFieldValue('customizations.scripts', newScripts);
  };

  const addCoprRepo = () => {
    setFieldValue('customizations.coprRepos', [...values.customizations.coprRepos, '']);
  };

  const removeCoprRepo = (index: number) => {
    const newRepos = values.customizations.coprRepos.filter((_, i) => i !== index);
    setFieldValue('customizations.coprRepos', newRepos);
  };

  const updateCoprRepo = (index: number, value: string) => {
    const newRepos = [...values.customizations.coprRepos];
    newRepos[index] = value;
    setFieldValue('customizations.coprRepos', newRepos);
  };

  const addSystemdUnit = () => {
    setFieldValue('customizations.systemdUnits', [
      ...values.customizations.systemdUnits,
      { name: '', content: '', enabled: true },
    ]);
  };

  const removeSystemdUnit = (index: number) => {
    const newUnits = values.customizations.systemdUnits.filter((_, i) => i !== index);
    setFieldValue('customizations.systemdUnits', newUnits);
  };

  const updateSystemdUnit = (index: number, field: 'name' | 'content' | 'enabled', value: string | boolean) => {
    const newUnits = [...values.customizations.systemdUnits];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setFieldValue('customizations.systemdUnits', newUnits);
  };

  return (
    <Stack hasGutter>
      {/* 1. COPR Repositories */}
      <StackItem>
        <Title headingLevel="h3" size="lg">
          {t('COPR Repositories')}
        </Title>
        <FormGroup
          label={t('COPR repositories to enable')}
          fieldId="coprRepos"
        >
          <div style={{ fontSize: 'var(--pf-v5-global--FontSize--sm)', color: 'var(--pf-v5-global--Color--200)', marginBottom: '8px' }}>
            {t('Add COPR repositories in the format: user/repo or @group/repo')}
          </div>
          {values.customizations.coprRepos.map((repo, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <TextInput
                id={`copr-repo-${index}`}
                value={repo}
                onChange={(_, value) => updateCoprRepo(index, value)}
                placeholder={t('user/repo or @group/repo')}
                style={{ flex: 1 }}
              />
              <Button
                variant="plain"
                icon={<TrashIcon />}
                onClick={() => removeCoprRepo(index)}
                aria-label={t('Remove COPR repository')}
              />
            </div>
          ))}
          <Button variant="link" icon={<PlusCircleIcon />} onClick={addCoprRepo}>
            {t('Add COPR repository')}
          </Button>
        </FormGroup>
      </StackItem>

      {/* Enable EPEL */}
      <StackItem>
        <FormGroup fieldId="enableEpel">
          <Checkbox
            id="enableEpel"
            label={t('Enable EPEL repositories')}
            description={t('Install epel-release and epel-next-release packages')}
            isChecked={values.customizations.enableEpel || false}
            onChange={(_, checked) => setFieldValue('customizations.enableEpel', checked)}
          />
        </FormGroup>
      </StackItem>

      {/* Enable Podman */}
      <StackItem>
        <FormGroup fieldId="enablePodman">
          <Checkbox
            id="enablePodman"
            label={t('Enable Podman service')}
            description={t('Enable Podman service at boot')}
            isChecked={values.customizations.enablePodman || false}
            onChange={(_, checked) => setFieldValue('customizations.enablePodman', checked)}
          />
        </FormGroup>
      </StackItem>

      {/* 2. Files */}
      <StackItem>
        <Title headingLevel="h3" size="lg">
          {t('Files')}
        </Title>
        <FormGroup
          label={t('Custom files')}
          fieldId="files"
        >
          {values.customizations.files.map((file, index) => (
            <FormSection key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #ccc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Title headingLevel="h4" size="md">
                  {t('File {{index}}', { index: index + 1 })}
                </Title>
                <Button
                  variant="plain"
                  icon={<TrashIcon />}
                  onClick={() => removeFile(index)}
                  aria-label={t('Remove file')}
                />
              </div>
              <FormGroup label={t('Path')} fieldId={`file-path-${index}`} isRequired>
                <TextInput
                  id={`file-path-${index}`}
                  value={file.path}
                  onChange={(_, value) => updateFile(index, 'path', value)}
                  placeholder={t('/etc/myapp/config.conf')}
                />
              </FormGroup>
              <FormGroup label={t('Content')} fieldId={`file-content-${index}`}>
                <TextArea
                  id={`file-content-${index}`}
                  value={file.content}
                  onChange={(_, value) => updateFile(index, 'content', value)}
                  placeholder={t('File content...')}
                  rows={4}
                />
              </FormGroup>
              <FormGroup label={t('Mode (permissions)')} fieldId={`file-mode-${index}`}>
                <TextInput
                  id={`file-mode-${index}`}
                  value={file.mode || ''}
                  onChange={(_, value) => updateFile(index, 'mode', value)}
                  placeholder={t('0644')}
                />
                <div style={{ fontSize: 'var(--pf-v5-global--FontSize--sm)', color: 'var(--pf-v5-global--Color--200)', marginTop: '4px' }}>
                  {t('Octal format (e.g., 0644, 0755)')}
                </div>
              </FormGroup>
              <FormGroup label={t('Owner user')} fieldId={`file-user-${index}`}>
                <TextInput
                  id={`file-user-${index}`}
                  value={file.user || ''}
                  onChange={(_, value) => updateFile(index, 'user', value)}
                  placeholder={t('root')}
                />
              </FormGroup>
              <FormGroup label={t('Owner group')} fieldId={`file-group-${index}`}>
                <TextInput
                  id={`file-group-${index}`}
                  value={file.group || ''}
                  onChange={(_, value) => updateFile(index, 'group', value)}
                  placeholder={t('root')}
                />
              </FormGroup>
            </FormSection>
          ))}
          <Button variant="link" icon={<PlusCircleIcon />} onClick={addFile}>
            {t('Add file')}
          </Button>
        </FormGroup>
      </StackItem>

      {/* 3. Scripts */}
      <StackItem>
        <Title headingLevel="h3" size="lg">
          {t('Scripts')}
        </Title>
        <FormGroup
          label={t('Custom scripts')}
          fieldId="scripts"
        >
          {values.customizations.scripts.map((script, index) => (
            <FormSection key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #ccc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Title headingLevel="h4" size="md">
                  {t('Script {{index}}', { index: index + 1 })}
                </Title>
                <Button
                  variant="plain"
                  icon={<TrashIcon />}
                  onClick={() => removeScript(index)}
                  aria-label={t('Remove script')}
                />
              </div>
              <FormGroup label={t('Path')} fieldId={`script-path-${index}`} isRequired>
                <TextInput
                  id={`script-path-${index}`}
                  value={script.path}
                  onChange={(_, value) => updateScript(index, 'path', value)}
                  placeholder={t('/usr/local/bin/setup.sh')}
                />
              </FormGroup>
              <FormGroup label={t('Content')} fieldId={`script-content-${index}`} isRequired>
                <TextArea
                  id={`script-content-${index}`}
                  value={script.content}
                  onChange={(_, value) => updateScript(index, 'content', value)}
                  placeholder={t('#!/bin/bash\n# Script content...')}
                  rows={6}
                />
              </FormGroup>
            </FormSection>
          ))}
          <Button variant="link" icon={<PlusCircleIcon />} onClick={addScript}>
            {t('Add script')}
          </Button>
        </FormGroup>
      </StackItem>

      {/* 4. Additional Packages */}
      <StackItem>
        <Title headingLevel="h3" size="lg">
          {t('Additional Packages')}
        </Title>
        <FormGroup
          label={t('Additional packages')}
          fieldId="packages"
        >
          {values.customizations.packages.map((pkg, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <TextInput
                id={`package-${index}`}
                value={pkg}
                onChange={(_, value) => updatePackage(index, value)}
                placeholder={t('package-name')}
                style={{ flex: 1 }}
              />
              <Button
                variant="plain"
                icon={<TrashIcon />}
                onClick={() => removePackage(index)}
                aria-label={t('Remove package')}
              />
            </div>
          ))}
          <Button variant="link" icon={<PlusCircleIcon />} onClick={addPackage}>
            {t('Add package')}
          </Button>
        </FormGroup>
      </StackItem>

      {/* 5. Systemd Units */}
      <StackItem>
        <Title headingLevel="h3" size="lg">
          {t('Systemd Units')}
        </Title>
        <FormGroup
          label={t('Custom systemd units')}
          fieldId="systemdUnits"
        >
          {values.customizations.systemdUnits.map((unit, index) => (
            <FormSection key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #ccc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Title headingLevel="h4" size="md">
                  {t('Systemd Unit {{index}}', { index: index + 1 })}
                </Title>
                <Button
                  variant="plain"
                  icon={<TrashIcon />}
                  onClick={() => removeSystemdUnit(index)}
                  aria-label={t('Remove systemd unit')}
                />
              </div>
              <FormGroup label={t('Unit name')} fieldId={`unit-name-${index}`} isRequired>
                <TextInput
                  id={`unit-name-${index}`}
                  value={unit.name}
                  onChange={(_, value) => updateSystemdUnit(index, 'name', value)}
                  placeholder={t('my-service.service')}
                />
              </FormGroup>
              <FormGroup fieldId={`unit-enabled-${index}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id={`unit-enabled-${index}`}
                    checked={unit.enabled !== false}
                    onChange={(e) => updateSystemdUnit(index, 'enabled', e.target.checked)}
                  />
                  <label htmlFor={`unit-enabled-${index}`}>{t('Enable unit')}</label>
                </div>
              </FormGroup>
              <FormGroup label={t('Unit content')} fieldId={`unit-content-${index}`} isRequired>
                <TextArea
                  id={`unit-content-${index}`}
                  value={unit.content}
                  onChange={(_, value) => updateSystemdUnit(index, 'content', value)}
                  placeholder={t('[Unit]\nDescription=My Service\n\n[Service]\nType=simple\nExecStart=/usr/bin/myapp\n\n[Install]\nWantedBy=multi-user.target')}
                  rows={8}
                />
              </FormGroup>
            </FormSection>
          ))}
          <Button variant="link" icon={<PlusCircleIcon />} onClick={addSystemdUnit}>
            {t('Add systemd unit')}
          </Button>
        </FormGroup>
      </StackItem>
    </Stack>
  );
};

export default CustomizationsStep;

