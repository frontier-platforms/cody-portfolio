TF_DIRS := infra/azure infra/snowflake

.PHONY: plan apply destroy lint generate test deploy

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

test:
	@echo "TODO (Phase 4): run dbt tests"

deploy:
	@echo "TODO (Phase 4): snow dbt deploy"
