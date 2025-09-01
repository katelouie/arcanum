# Enhanced Training Data Context Strings Index

This directory contains context strings generated for all 10/52 planned training readings, including custom spreads.

**Statistics:**
- **Total Readings:** 52
- **Successfully Generated:** 10
- **Custom Spreads Processed:** 10
- **Total Context Tokens:** 13,183
- **Average Tokens per Reading:** 1,318

## Generated Files

- [R041](R041_context.md)
- [R042](R042_context.md)
- [R043](R043_context.md)
- [R044](R044_context.md)
- [R045](R045_context.md)
- [R046](R046_context.md)
- [R047](R047_context.md)
- [R048](R048_context.md)
- [R049](R049_context.md)
- [R050](R050_context.md)

---

## Enhanced Features

This enhanced generator now supports:

1. **Regular Spreads** - Uses spreads-config.json definitions
2. **Custom Spreads** - Uses embedded spread_config from readings
3. **Temporary Configuration** - Creates temporary spread configs for custom spreads
4. **Automatic Cleanup** - Removes temporary files after processing

## Usage in Dev Training Data Area

These context string files are referenced in the dev training data area to show exactly what context is sent to the model for each reading, including custom spreads with their unique position definitions.

*Generated automatically by enhanced_training_context_generator.py*
