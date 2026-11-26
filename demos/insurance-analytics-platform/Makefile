TF_DIRS := infra/azure infra/snowflake

# dbt reads credentials from real shell env vars via env_var() in profiles.yml, not
# from .env directly the way the Python generator does with python-dotenv - `set -a`
# exports every var `. ./.env` defines, so dbt (and `snow`) can see them without a
# separate secrets mechanism.
DBT_ENV := set -a && . ./.env && set +a &&

.PHONY: plan apply destroy lint generate test deploy dbt-debug dbt-deps dbt-build dbt-test

plan:
	@for d in $(TF_DIRS); do \
		echo "==> terraform plan: $$d"; \
		terraform -chdir=$$d init -input=false && \
		terraform -chdir=$$d plan; \
	done

apply:
	@for d in $(TF_DIRS); do \
		echo "==> terraform apply: $$d"; \
		terraform -chdir=$$d init -input=false && \
		terraform -chdir=$$d apply; \
	done

destroy:
	@for d in $(TF_DIRS); do \
		echo "==> terraform destroy: $$d"; \
		terraform -chdir=$$d destroy; \
	done

lint:
	pre-commit run --all-files -c .pre-commit-config.yaml

generate:
	@echo "TODO (Phase 2): run the synthetic data generator"

dbt-debug:
	@$(DBT_ENV) cd dbt && uv run dbt debug --profiles-dir .

dbt-deps:
	@$(DBT_ENV) cd dbt && uv run dbt deps --profiles-dir .

dbt-build:
	@$(DBT_ENV) cd dbt && uv run dbt build --profiles-dir .

dbt-test:
	@$(DBT_ENV) cd dbt && uv run dbt test --profiles-dir .

test: dbt-build

deploy:
	@echo "TODO (Phase 4, later step): snow dbt deploy once the project builds cleanly"
