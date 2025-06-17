# HEO GitLab CI/CD Template Setup

Get reproducible science workflows in your lab repo in under 5 minutes.

## 🚀 Quick Setup

### 1. Copy Template Files

Copy these files to your lab repository:

```bash
# Copy the CI/CD template
curl -o .gitlab-ci.yml https://raw.githubusercontent.com/jd316/heo/main/.gitlab-ci.yml

# Copy sample protocol file
curl -o protocol.json https://raw.githubusercontent.com/jd316/heo/main/examples/protocol_template.json
```

### 2. Configure GitLab Variables

In your GitLab project, go to **Settings > CI/CD > Variables** and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `HEO_API_TOKEN` | `your_heo_api_token` | Get from <https://heo.anything.ai/api-keys> |
| `RESEARCH_QUERY` | `"Your research question"` | The hypothesis you want to test |

### 3. Customize Your Protocol

Edit `protocol.json` in your repo:

```json
{
  "name": "Your Protocol Name",
  "type": "pcr|crispr|elisa",
  "steps": [
    {
      "id": "step_1",
      "description": "Add reagent A",
      "temperature": 25,
      "duration": "10 minutes"
    }
  ],
  "safety_requirements": {
    "bsl_level": 2,
    "safety_cabinet": true,
    "ppe_required": true
  }
}
```

### 4. Push and Run

```bash
git add .gitlab-ci.yml protocol.json
git commit -m "Add HEO automated research pipeline"
git push origin main
```

Your pipeline will automatically:

1. ✅ Validate your protocol
2. 🧠 Generate AI hypothesis
3. 🧪 Execute in cloud lab
4. 🔐 Generate zkSNARK proof
5. 🌐 Publish to IPFS + DKG

## 🔍 Pipeline Outputs

After each run, check your GitLab artifacts:

- `hypothesis_results.json` - AI-generated hypotheses
- `experiment_results.json` - Lab execution data
- `proof_results.json` - zkSNARK validation proof
- `published_results.json` - IPFS/DKG publication info
- `EXPERIMENT_REPORT.md` - Human-readable summary

## 🛠️ Advanced Configuration

### Custom Lab Integration

If you have your own lab automation system:

```yaml
# Add to .gitlab-ci.yml
run_custom_lab:
  stage: experiment
  script:
    - ./your_lab_automation_script.sh
    - curl -X POST "$HEO_API_BASE/lab/results" -d @results.json
```

### Multi-Protocol Workflows

For complex experiments with multiple protocols:

```yaml
# Matrix builds for different protocols
run_experiment:
  parallel:
    matrix:
      - PROTOCOL: ["pcr_protocol.json", "crispr_protocol.json"]
  script:
    - heo validate-protocol --file $PROTOCOL
    - # ... rest of pipeline
```

## 📊 Monitoring & Analytics

View your lab's reproducibility metrics:

- Visit <https://heo.anything.ai/analytics>
- Connect your GitLab repo
- See success rates, cost savings, and reproducibility scores

## 🆘 Troubleshooting

### Common Issues

**Pipeline fails at validation:**

- Check your `protocol.json` syntax with [JSON Validator](https://jsonlint.com/)
- Ensure all required fields are present

**Authentication errors:**

- Verify your `HEO_API_TOKEN` is set correctly
- Check token hasn't expired at <https://heo.anything.ai/tokens>

**Lab execution timeouts:**

- Increase timeout in `.gitlab-ci.yml`: `timeout: 2h`
- For long protocols, use staged execution

### Support

- 📖 Full docs: <https://docs.heo.anything.ai>
- 💬 Discord: <https://discord.gg/heo>
- 📧 Email: <support@heo.anything.ai>
- 🐛 Issues: <https://github.com/jd316/heo/issues>

## 🎯 Next Steps

Once your pipeline is running:

1. **Explore Advanced Features:**
   - Token rewards for validation
   - Hypothesis marketplace
   - Cross-lab collaborations

2. **Join the Community:**
   - Share protocols in our template library
   - Contribute to open science initiatives
   - Earn tokens for validated experiments

3. **Scale Up:**
   - Connect multiple lab instruments
   - Set up automated reagent ordering
   - Integrate with your LIMS/ELN

---

**Made with ❤️ by the HEO team**  
*Making reproducible science as easy as pushing code*
