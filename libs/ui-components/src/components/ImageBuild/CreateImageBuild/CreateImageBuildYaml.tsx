import * as React from 'react';
import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { load } from 'js-yaml';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

import { useTranslation } from '../../../hooks/useTranslation';
import { useFetch } from '../../../hooks/useFetch';
import { getErrorMessage } from '../../../utils/error';
import { Link, ROUTE, useNavigate } from '../../../hooks/useNavigate';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import { RESOURCE, VERB } from '../../../types/rbac';
import { useAccessReview } from '../../../hooks/useAccessReview';
import PageWithPermissions from '../../common/PageWithPermissions';
import ErrorBoundary from '../../common/ErrorBoundary';
import { ImageBuild } from '../useImageBuilds';
import { useThemePreferences } from '../../../hooks/useThemePreferences';
import '../../common/CodeEditor/YamlEditor.css';

const defaultImageBuildYaml = `apiVersion: flightctl.io/v1alpha1
kind: ImageBuild
metadata:
  name: ""
spec:
  baseImage: ""
  customizations:
    packages: []
    files: []
    scripts: []
  flightctlConfig:
    agents: []
    policies: {}
  pushToRegistry: false
`;

const CreateImageBuildYaml = () => {
  const { t } = useTranslation();
  const { post } = useFetch();
  const navigate = useNavigate();
  const { resolvedTheme } = useThemePreferences();
  const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const [yaml, setYaml] = React.useState<string>(defaultImageBuildYaml);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [saveError, setSaveError] = React.useState<string | undefined>(undefined);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = React.useState<boolean>(false);

  const [canCreate] = useAccessReview(RESOURCE.IMAGE_BUILD, VERB.CREATE);

  const handleSave = async (updatedYaml: string | undefined) => {
    if (!updatedYaml) {
      return;
    }

    let imageBuild: ImageBuild;
    try {
      imageBuild = load(updatedYaml) as ImageBuild;
    } catch (error) {
      setSaveError(getErrorMessage(error));
      return;
    }

    // Validate required fields
    if (!imageBuild.metadata?.name) {
      setSaveError(t('Name is required'));
      return;
    }

    if (!imageBuild.spec?.baseImage) {
      setSaveError(t('Base image is required'));
      return;
    }

    setSaveError(undefined);
    setIsSavedSuccessfully(false);
    setIsSaving(true);

    try {
      await post('imagebuilds', imageBuild);
      setIsSavedSuccessfully(true);
      setTimeout(() => {
        navigate(ROUTE.IMAGE_BUILDS);
      }, 1500);
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageWithPermissions allowed={canCreate} loading={false}>
      <PageSection variant={PageSectionVariants.light} type="breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={ROUTE.IMAGE_BUILDS}>{t('Image Builder')}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{t('Create Image Build from YAML')}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="3xl">
          {t('Create Image Build from YAML')}
        </Title>
      </PageSection>
      <PageSection>
        <Stack hasGutter>
          {isSavedSuccessfully && (
            <StackItem>
              <Alert
                isInline
                variant="success"
                title={t('Image build created successfully')}
                actionClose={<AlertActionCloseButton onClose={() => setIsSavedSuccessfully(false)} />}
              >
                {t('Redirecting to image builds list...')}
              </Alert>
            </StackItem>
          )}

          {saveError && (
            <StackItem>
              <Alert isInline variant="danger" title={t('Error creating image build')}>
                {saveError}
              </Alert>
            </StackItem>
          )}

          <StackItem>
            <ErrorBoundary>
              <div className="fctl-yaml-editor">
                <CodeEditor
                  code={yaml}
                  language={Language.yaml}
                  onChange={(value) => setYaml(value || '')}
                  isCopyEnabled
                  isDownloadEnabled
                  downloadFileName="imagebuild.yaml"
                  onEditorDidMount={(editor: monacoEditor.editor.IStandaloneCodeEditor) => {
                    editorRef.current = editor;
                    // Force layout to ensure proper height
                    setTimeout(() => {
                      editor.layout();
                    }, 100);
                  }}
                  options={{
                    theme: `console-${resolvedTheme}`,
                    automaticLayout: true,
                  }}
                />
              </div>
              <ActionGroup style={{ marginTop: '16px' }}>
                <Button variant="primary" onClick={() => handleSave(yaml)} isDisabled={isSaving}>
                  {isSaving ? t('Creating...') : t('Create Image Build')}
                </Button>
                <Button variant="secondary" onClick={() => navigate(ROUTE.IMAGE_BUILDS)}>
                  {t('Cancel')}
                </Button>
              </ActionGroup>
            </ErrorBoundary>
          </StackItem>
        </Stack>
      </PageSection>
    </PageWithPermissions>
  );
};

export default CreateImageBuildYaml;

