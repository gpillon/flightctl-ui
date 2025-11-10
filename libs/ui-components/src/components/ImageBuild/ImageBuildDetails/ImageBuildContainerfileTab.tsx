import * as React from 'react';
import {
  Alert,
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { ImageBuild } from '../useImageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import { useThemePreferences } from '../../../hooks/useThemePreferences';
import { defineConsoleThemes } from '../../common/CodeEditor/CodeEditorTheme';
import { useFetch } from '../../../hooks/useFetch';
import { getErrorMessage } from '../../../utils/error';
import '../../common/CodeEditor/YamlEditor.css';

type Monaco = typeof monacoEditor;

type ImageBuildContainerfileTabProps = {
  imageBuild: ImageBuild;
  refetch: VoidFunction;
};

const ImageBuildContainerfileTab = ({ imageBuild, refetch }: ImageBuildContainerfileTabProps) => {
  const { t } = useTranslation();
  const { put, post } = useFetch();
  const { resolvedTheme } = useThemePreferences();
  const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = React.useRef<Monaco | null>(null);

  const [containerfile, setContainerfile] = React.useState<string>(
    imageBuild.spec.containerfile || '# Loading generated Containerfile...'
  );
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | undefined>();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingGenerated, setIsLoadingGenerated] = React.useState(!imageBuild.spec.containerfile);
  const [isGenerated] = React.useState(false);

  // Initialize containerfile and generate if needed
  React.useEffect(() => {
    // If containerfile already exists, use it directly
    if (imageBuild.spec.containerfile) {
      setContainerfile(imageBuild.spec.containerfile);
      setIsLoadingGenerated(false);
      return;
    }

    // Otherwise, generate it from the spec
    const generateContainerfile = async () => {
      try {
        setIsLoadingGenerated(true);
        const response: any = await post('imagebuilds/generate-containerfile', {
          spec: imageBuild.spec,
          enrollmentCert: '',
        });
        setContainerfile(response.containerfile || '');
      } catch (error) {
        setContainerfile(`# Error generating Containerfile:\n# ${getErrorMessage(error)}`);
      } finally {
        setIsLoadingGenerated(false);
      }
    };

    generateContainerfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not when spec changes

  const hasChanges = containerfile !== (imageBuild.spec.containerfile || '');

  const handleSave = async () => {
    setSaveError(undefined);
    setIsSaving(true);

    try {
      // Update the ImageBuild with the new Containerfile
      const updatedBuild: ImageBuild = {
        ...imageBuild,
        spec: {
          ...imageBuild.spec,
          containerfile: containerfile,
        },
      };

      await put<ImageBuild>(`imagebuilds/${imageBuild.metadata.name}`, updatedBuild);

      setIsEditing(false);
      setIsSaveModalOpen(false);
      refetch();
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // setContainerfile(imageBuild.spec.containerfile || '# No Containerfile available');
    setIsEditing(false);
    setSaveError(undefined);
  };

  return (
    <Stack hasGutter>
      {saveError && (
        <StackItem>
          <Alert variant="danger" title={t('Error saving Containerfile')} isInline>
            {saveError}
          </Alert>
        </StackItem>
      )}

      {!imageBuild.spec.containerfile && !isLoadingGenerated && (
        <StackItem>
          <Alert variant="info" title={t('Generated Containerfile')} isInline>
            {isGenerated
              ? t('This Containerfile is manually edited. You can edit and save it as a custom Containerfile.')
              : t('The Containerfile will be generated from the build specification. Section below will show the generated Containerfile.')}
          </Alert>
        </StackItem>
      )}

      <StackItem>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
          {!isEditing ? (
            <>
              <Button variant={ButtonVariant.primary} onClick={() => setIsEditing(true)}>
                {t('Edit Containerfile')}
              </Button>
              {imageBuild.spec.containerfile && !isEditing && (
                <Button
                  variant={ButtonVariant.warning}
                  onClick={async () => {
                    try {
                      setIsSaving(true);
                      setSaveError(undefined);
                      delete imageBuild.spec.containerfile;
                      await put<ImageBuild>(`imagebuilds/${imageBuild.metadata.name}`, imageBuild);
                      refetch();
                    } catch (error) {
                      setSaveError(getErrorMessage(error));
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {t('Remove Containerfile')}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant={ButtonVariant.secondary} onClick={handleCancel}>
                {t('Cancel')}
              </Button>
              <Button
                variant={ButtonVariant.primary}
                onClick={() => setIsSaveModalOpen(true)}
                isDisabled={!hasChanges}
              >
                {t('Save changes')}
              </Button>
            </>
          )}
        </div>
      </StackItem>

      <StackItem>
        {isLoadingGenerated ? (
          <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>Loading generated Containerfile...</div>
          </div>
        ) : (
          <div className="fctl-yaml-editor">
            <CodeEditor
              code={containerfile}
              language={Language.dockerfile}
              onChange={(value) => isEditing && setContainerfile(value || '')}
              isCopyEnabled
              isDownloadEnabled
              downloadFileName="Containerfile"
              isReadOnly={!isEditing}
              onEditorDidMount={(editor: monacoEditor.editor.IStandaloneCodeEditor, instance: Monaco) => {
                defineConsoleThemes(instance);
                monacoRef.current = instance;
                editorRef.current = editor;
                setTimeout(() => {
                  editor.layout();
                }, 100);
              }}
              options={{
                theme: `console-${resolvedTheme}`,
                automaticLayout: true,
                readOnly: !isEditing,
              }}
            />
          </div>
        )}
      </StackItem>

      <Modal
        variant={ModalVariant.small}
        title={t('Save Containerfile changes')}
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        appendTo={() => document.body}
        actions={[
          <Button
            key="save"
            variant={ButtonVariant.primary}
            onClick={handleSave}
            isLoading={isSaving}
            isDisabled={isSaving}
            autoFocus
          >
            {t('Save')}
          </Button>,
          <Button
            key="cancel"
            variant={ButtonVariant.link}
            onClick={() => setIsSaveModalOpen(false)}
            isDisabled={isSaving}
          >
            {t('Cancel')}
          </Button>,
        ]}
      >
        <Stack hasGutter>
          <StackItem>
            {t('Saving changes will update the Containerfile for this build. This action cannot be undone.')}
          </StackItem>
          <StackItem>
            <Alert variant="warning" title={t('Important')} isInline>
              {t('The build will need to be re-executed with the new Containerfile to take effect.')}
            </Alert>
          </StackItem>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ImageBuildContainerfileTab;

