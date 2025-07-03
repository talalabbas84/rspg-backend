# (Content from previous response - unchanged and correct)
from jinja2 import Environment, select_autoescape, meta, UndefinedError, StrictUndefined
import json
from typing import Dict, Any, List, Set
import logging

logger = logging.getLogger(__name__)

jinja_env = Environment(
    loader=None, # Templates are passed as strings
    autoescape=select_autoescape(['html', 'xml']), # Be cautious if not generating HTML
    undefined=StrictUndefined, # Raise error for undefined variables
    trim_blocks=True,
    lstrip_blocks=True,
)

def get_template_variables(template_string: str) -> Set[str]:
    """Parses a Jinja2 template string and returns a set of undeclared variables."""
    if not template_string:
        return set()
    try:
        parsed_content = jinja_env.parse(template_string)
        return meta.find_undeclared_variables(parsed_content)
    except Exception as e:
        logger.error(f"Error parsing template to find variables: '{template_string[:100]}...': {e}")
        # Depending on strictness, you might re-raise or return empty set
        raise ValueError(f"Invalid template syntax: {e}")

import re

def render_prompt(template_string: str, context: Dict[str, Any]) -> str:
    """Renders a prompt template with the given context, supporting both <<var>> and {{ var }} syntax."""
    if not template_string:
        return ""
    # Preprocess: Replace <<var>> with {{ var }}
    # Handles whitespace too: << var >> → {{ var }}
    template_string = re.sub(r"<<\s*(\w+)\s*>>", r"{{ \1 }}", template_string)

    try:
        template = jinja_env.from_string(template_string)
        return template.render(context)
    except StrictUndefined as e:
        logger.warning(f"Undefined variable in prompt template: {e.message}. Template: '{template_string[:100]}...' Context keys: {list(context.keys())}")
        raise ValueError(f"Missing variable in prompt: {e.message}. Ensure all {{{{variable_name}}}} are provided and spelled correctly. Available context keys: {list(context.keys())}")
    except Exception as e:
        logger.error(f"Error rendering prompt template: '{template_string[:100]}...': {e}", exc_info=True)
        raise ValueError(f"Error during prompt rendering: {e}")


def discretize_output(llm_output: str, output_names: List[str]) -> Dict[str, str]:
    """
    Attempts to robustly parse JSON from LLM output (even if extra lines/text exist)
    and map it to the provided output_names.
    """
    import re
    named_outputs = {name: "" for name in output_names}

    if not llm_output or not output_names:
        return named_outputs
    

    # --- Step 1: Robustly extract JSON object from anywhere in the string ---
    json_block = None
    try:
        # This regex finds the first {...} block in the output
        match = re.search(r'\{[\s\S]*\}', llm_output)
        if match:
            json_block = match.group()
            data = json.loads(json_block)
            if isinstance(data, dict):
                data_values = list(data.values())
                for i, name in enumerate(output_names):
                    if name in data:
                        named_outputs[name] = str(data[name])
                    elif i < len(data_values):
                        named_outputs[name] = str(data_values[i])
                    else:
                        named_outputs[name] = ""
                return named_outputs
    except Exception as e:
        logger.debug(f"Failed to robustly extract JSON from LLM output: {e}")

    # --- Step 2: Fallback to pure JSON parsing if above didn't work ---
    try:
        data = json.loads(llm_output)
        if isinstance(data, dict):
            for name in output_names:
                named_outputs[name] = str(data.get(name, "")) if data.get(name) is not None else ""
            return named_outputs
        elif isinstance(data, list) and len(data) == len(output_names):
            for i, name in enumerate(output_names):
                named_outputs[name] = str(data[i]) if data[i] is not None else ""
            return named_outputs
    except Exception:
        pass

    # --- Step 3: If only one output, assign the whole text ---
    if len(output_names) == 1:
        named_outputs[output_names[0]] = llm_output.strip()
        return named_outputs

    # --- Step 4: Try to extract each output via regex key matching (best effort) ---
    for name in output_names:
        regex = re.compile(rf'"?{re.escape(name)}"?\s*:\s*["\']?(.*?)["\']?(?:,|\n|\}})', re.IGNORECASE)
        found = regex.search(llm_output)
        if found:
            named_outputs[name] = found.group(1).strip()

    # If still nothing, log warning
    for name in output_names:
        if not named_outputs[name] and llm_output:
            logger.warning(f"Discretization: Could not find or parse value for output name '{name}'.")
    return named_outputs
