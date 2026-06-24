/**
 * Replaces placeholders in a template string with given values.
 * Placeholders should be in the format {key}.
 * 
 * @param template The template string (e.g. "Hello {name}")
 * @param variables The variables to replace (e.g. { name: "World" })
 * @returns The formatted string
 */
export const formatTemplate = (
  template: string, 
  variables: Record<string, string | number>
): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in variables ? String(variables[key]) : match;
  });
};
