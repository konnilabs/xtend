export const {{className}}A11yProfile = {{a11yProfileJson}} as const;

export const {{className}}A11yScaffoldContract = {
  componentContract: '{{a11yComponentContractSchema}}',
  profile: '{{a11yProfileSchema}}',
  screenreaderSignals: '{{a11yScreenreaderContractSchema}}',
  motionContrast: '{{a11yMotionContrastContractSchema}}',
  requiredFixtureAttributes: ['aria-label']
} as const;

export default {{className}}A11yProfile;
