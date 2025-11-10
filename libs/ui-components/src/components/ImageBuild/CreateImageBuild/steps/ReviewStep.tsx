import * as React from 'react';
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Title,
  Divider,
  Spinner,
  Bullseye,
} from '@patternfly/react-core';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getErrorMessage } from '../../../../utils/error';
import { generateContainerfile, getImageBuildResource } from '../utils';
import { useThemePreferences } from '../../../../hooks/useThemePreferences';
import { useFetch } from '../../../../hooks/useFetch';
import '../CreateImageBuildWizard.css';

export const reviewStepId = 'review-step';

type ReviewStepProps = {
  error?: unknown;
} & React.PropsWithChildren;

const ReviewStep = ({ error }: ReviewStepProps) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ImageBuildFormValues>();
  const { resolvedTheme } = useThemePreferences();
  const { post } = useFetch();
  const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const [editorMounted, setEditorMounted] = React.useState(false);
  const [containerfile, setContainerfile] = React.useState<string>('');
  const [isLoadingContainerfile, setIsLoadingContainerfile] = React.useState(true);
  const [containerfileError, setContainerfileError] = React.useState<string | undefined>();
  
  // Generate containerfile via backend API
  React.useEffect(() => {
    const generateViaBackend = async () => {
      try {
        setIsLoadingContainerfile(true);
        setContainerfileError(undefined);
        
        // Convert form values to ImageBuildSpec
        const imageBuildResource = getImageBuildResource(values);
        const response: any = await post('imagebuilds/generate-containerfile', {
          spec: imageBuildResource.spec,
          enrollmentCert: '',
        });
        setContainerfile(response.containerfile || '');
      } catch (err) {
        // Fallback to local generation if API fails
        console.warn('Failed to generate Containerfile via API, using local generation:', err);
        setContainerfileError(getErrorMessage(err));
        setContainerfile(generateContainerfile(values));
      } finally {
        setIsLoadingContainerfile(false);
      }
    };
    
    generateViaBackend();
  }, [values, post]);

  // Handle editor resize when mounted
  React.useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        const container = editorRef.current.getContainerDomNode();
        const parent = container?.parentElement?.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          editorRef.current.layout({ width: rect.width, height: 600 });
        } else {
          editorRef.current.layout({ width: 0, height: 0 });
          editorRef.current.layout();
        }
      }
    };
    
    if (editorMounted) {
      window.addEventListener('resize', handleResize);
      // Trigger initial layout with delay to ensure DOM is ready
      setTimeout(() => {
        handleResize();
      }, 300);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [editorMounted]);

  return (
    <Stack hasGutter>
      {error ? (
        <StackItem>
          <Alert isInline variant="danger" title={t('An error occurred')}>
            <div>{getErrorMessage(error)}</div>
          </Alert>
        </StackItem>
      ) : null}

      <StackItem>
        <Title headingLevel="h3" size="lg">
          {t('Review configuration')}
        </Title>
      </StackItem>

      <StackItem>
        <Title headingLevel="h4" size="md" style={{ marginBottom: '16px' }}>
          {t('Configuration Summary')}
        </Title>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Build name')}</DescriptionListTerm>
            <DescriptionListDescription>{values.name}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Base image')}</DescriptionListTerm>
            <DescriptionListDescription>{values.baseImage}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Packages')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.customizations.packages.length > 0
                ? values.customizations.packages.join(', ')
                : t('None')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Files')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.customizations.files.length > 0
                ? t('{{count}} file(s)', { count: values.customizations.files.length })
                : t('None')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Scripts')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.customizations.scripts.length > 0
                ? t('{{count}} script(s)', { count: values.customizations.scripts.length })
                : t('None')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('SSH Keys')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.customizations.sshKeys && values.customizations.sshKeys.length > 0
                ? t('{{count}} SSH key(s)', { count: values.customizations.sshKeys.length })
                : t('None')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Additional Users')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.customizations.users && values.customizations.users.length > 0
                ? t('{{count}} user(s)', { count: values.customizations.users.length })
                : t('None')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Bootc Export Formats')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.bootcExports && values.bootcExports.length > 0
                ? values.bootcExports
                    .map((exp) => `${exp.type}${exp.architecture ? ` (${exp.architecture})` : ''}`)
                    .join(', ')
                : t('None')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Enrollment Server')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.flightctlConfig.enrollmentService.server || t('Not configured')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Spec Fetch Interval')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.flightctlConfig.specFetchInterval || t('Default (60s)')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Status Update Interval')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.flightctlConfig.statusUpdateInterval || t('Default (60s)')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Log Level')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.flightctlConfig.logLevel || t('Default (info)')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('System Info Collectors')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.flightctlConfig.systemInfo.length > 0
                ? values.flightctlConfig.systemInfo.join(', ')
                : t('Default set')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          {values.flightctlConfig.systemInfoCustom.length > 0 && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Custom System Info Collectors')}</DescriptionListTerm>
              <DescriptionListDescription>
                {values.flightctlConfig.systemInfoCustom.join(', ')}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {Object.keys(values.flightctlConfig.defaultLabels).length > 0 && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Default Labels')}</DescriptionListTerm>
              <DescriptionListDescription>
                {Object.entries(values.flightctlConfig.defaultLabels)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(', ')}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {values.flightctlConfig.tpm.enabled && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('TPM Enabled')}</DescriptionListTerm>
              <DescriptionListDescription>{t('Yes')}</DescriptionListDescription>
            </DescriptionListGroup>
          )}

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Push to registry')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.pushToRegistry ? t('Yes') : t('No')}
            </DescriptionListDescription>
          </DescriptionListGroup>

          {values.pushToRegistry && (
            <>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Registry URL')}</DescriptionListTerm>
                <DescriptionListDescription>{values.containerRegistry.url}</DescriptionListDescription>
              </DescriptionListGroup>
              {values.containerRegistry.username && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Registry username')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {values.containerRegistry.username}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </>
          )}
        </DescriptionList>
      </StackItem>

      <StackItem>
        <Divider />
      </StackItem>

      <StackItem>
        <Title headingLevel="h4" size="md" style={{ marginBottom: '16px' }}>
          {t('Containerfile Preview')}
        </Title>
        {containerfileError && (
          <Alert variant="warning" title={t('Containerfile generation warning')} isInline style={{ marginBottom: '16px' }}>
            {t('Using fallback containerfile generation. API error: {{error}}', { error: containerfileError })}
          </Alert>
        )}
        {isLoadingContainerfile ? (
          <Bullseye style={{ minHeight: '400px' }}>
            <Spinner size="xl" />
          </Bullseye>
        ) : (
          <div className="fctl-containerfile-preview" style={{ border: '1px solid #ccc' }}>
            <CodeEditor
              code={containerfile}
              language={Language.dockerfile}
              isReadOnly
              isCopyEnabled
              isDownloadEnabled
              downloadFileName="Containerfile"
              onEditorDidMount={(editor: monacoEditor.editor.IStandaloneCodeEditor) => {
                setEditorMounted(true);
                editorRef.current = editor;
                // Force layout after mount with correct dimensions
                setTimeout(() => {
                  const container = editor.getContainerDomNode();
                  const parent = container?.parentElement;
                  if (parent) {
                    const rect = parent.getBoundingClientRect();
                    editor.layout({ width: rect.width, height: 600 });
                  } else {
                    editor.layout({ width: 0, height: 0 });
                    editor.layout();
                  }
                }, 200);
              }}
              options={{
                theme: `console-${resolvedTheme}`,
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        )}
      </StackItem>
    </Stack>
  );
};

export default ReviewStep;

