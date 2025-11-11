import * as React from 'react';
import {
  Checkbox,
  FormGroup,
  Stack,
  StackItem,
  Title,
  FormSection,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const bootcExportsStepId = 'bootc-exports-step';

export const isBootcExportsStepValid = (errors: any): boolean => {
  return !errors.bootcExports;
};

type ExportType = 'iso' | 'ami' | 'vmdk' | 'qcow2' | 'raw' | 'tar';
type Architecture = 'x86_64' | 'aarch64';

const BootcExportsStep = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ImageBuildFormValues>();

  const exportTypes: Array<{ value: ExportType; label: string; description: string }> = [
    { value: 'iso', label: t('ISO'), description: t('ISO image for CD/DVD/USB boot') },
    { value: 'ami', label: t('AMI'), description: t('Amazon Machine Image for AWS') },
    { value: 'vmdk', label: t('VMDK'), description: t('VMware Virtual Machine Disk') },
    { value: 'qcow2', label: t('QCOW2'), description: t('QEMU Copy-On-Write format') },
    { value: 'raw', label: t('RAW'), description: t('Raw disk image') },
    { value: 'tar', label: t('TAR'), description: t('Tarball archive') },
  ];

  const architectures: Array<{ value: Architecture; label: string }> = [
    { value: 'x86_64', label: t('x86_64 (AMD64)') },
    { value: 'aarch64', label: t('aarch64 (ARM64)') },
  ];

  const toggleExportType = (type: ExportType, architecture?: Architecture) => {
    const currentExports = values.bootcExports || [];
    const existingIndex = currentExports.findIndex(
      (exp) => exp.type === type && (!architecture || exp.architecture === architecture),
    );

    if (existingIndex >= 0) {
      // Remove if exists
      const newExports = currentExports.filter((_, i) => i !== existingIndex);
      setFieldValue('bootcExports', newExports);
    } else {
      // Add new
      const newExport: { type: ExportType; architecture?: Architecture } = { type };
      if (architecture) {
        newExport.architecture = architecture;
      }
      setFieldValue('bootcExports', [...currentExports, newExport]);
    }
  };

  const isExportSelected = (type: ExportType, architecture?: Architecture): boolean => {
    const currentExports = values.bootcExports || [];
    return currentExports.some(
      (exp) => exp.type === type && (!architecture || exp.architecture === architecture),
    );
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h3" size="lg">
          {t('Bootc Export Formats')}
        </Title>
        <div style={{ marginBottom: '16px', color: '#666' }}>
          {t('Select the formats you want to export the bootc image as. You can export to multiple formats.')}
        </div>
      </StackItem>

      {exportTypes.map((exportType) => (
        <StackItem key={exportType.value}>
          <FormSection style={{ padding: '16px', border: '1px solid #ccc' }}>
            <div style={{ marginBottom: '12px' }}>
              <Checkbox
                id={`export-${exportType.value}`}
                label={
                  <div>
                    <strong>{exportType.label}</strong>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
                      {exportType.description}
                    </div>
                  </div>
                }
                isChecked={isExportSelected(exportType.value)}
                onChange={(checked) => {
                  if (checked) {
                    // Add with default architecture (x86_64)
                    toggleExportType(exportType.value, 'x86_64');
                  } else {
                    // Remove all architectures for this type
                    const currentExports = values.bootcExports || [];
                    const newExports = currentExports.filter((exp) => exp.type !== exportType.value);
                    setFieldValue('bootcExports', newExports);
                  }
                }}
              />
            </div>

            {isExportSelected(exportType.value) && (
              <div style={{ marginLeft: '24px', marginTop: '12px' }}>
                <FormGroup label={t('Architecture')} fieldId={`export-${exportType.value}-arch`}>
                  {architectures.map((arch) => (
                    <Checkbox
                      key={arch.value}
                      id={`export-${exportType.value}-${arch.value}`}
                      label={arch.label}
                      isChecked={isExportSelected(exportType.value, arch.value)}
                      onChange={(checked) => {
                        if (checked) {
                          toggleExportType(exportType.value, arch.value);
                        } else {
                          const currentExports = values.bootcExports || [];
                          const newExports = currentExports.filter(
                            (exp) => !(exp.type === exportType.value && exp.architecture === arch.value),
                          );
                          setFieldValue('bootcExports', newExports);
                        }
                      }}
                    />
                  ))}
                </FormGroup>
              </div>
            )}
          </FormSection>
        </StackItem>
      ))}
    </Stack>
  );
};

export default BootcExportsStep;

