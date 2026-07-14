---
title: Rails と比較した Spring Boot
description: Rails の各部品が Spring Boot ではどこに置かれるか、思想の違いも含めて対応づける
---

## 一言でいうと

- **Rails**: フルスタックのフレームワーク。ORM もメーラーもジョブも「本体に入っている」。設定より規約。
- **Spring Boot**: DI コンテナという**核**に、必要な機能を **starter（依存）として自分で足していく**組み立て式。「規約」は starter が持ち込む自動構成（auto-configuration）として提供される。

Rails で当たり前に使っているものの多くが、Spring では「依存を足して初めて存在する」。逆に Spring には Rails にない核（DI コンテナ・静的型・Actuator）がある。

現行は **Spring Boot 4.1**（2026年6月リリース、Spring Framework 7 ベース、Java 17 以上）。

---

## 対応表

| Rails の部品 | Spring での置き場所 | 備考 |
|---|---|---|
| Active Record | Spring Data JPA | 要依存。Hibernate が実体 |
| マイグレーション | Flyway / Liquibase | 要依存。Rails は本体機能 |
| Action Controller / ルーティング | Spring Web (Spring MVC) | 要依存 |
| Action View (ERB) | Thymeleaf | 要依存 |
| Active Model のバリデーション | Bean Validation (Jakarta Validation) | 要依存 |
| `has_secure_password` / Devise | Spring Security | 要依存。Devise ほど「載せるだけ」ではない |
| Action Mailer | Java Mail Sender | 要依存 |
| Action Cable | Spring WebSocket | 要依存 |
| `config/environments`（開発/本番切替） | Spring Profiles | **依存なし・核に内蔵** |
| `Rails.cache` | Spring Cache | 依存なしで抽象だけ存在。実体に Redis 等を足す |
| Active Job | 対応なし | `@Async` は近いが永続キューではない。実務は Spring Batch / Quartz / Kafka |
| Active Storage | 対応なし | 自前実装 or AWS SDK |
| `rails generate scaffold` | 対応なし | Spring Initializr は空の雛形を作るだけ |
| `rails console` | 対応なし | JShell や Spring Shell が近いが別物 |

### 逆に Spring にあって Rails にないもの

| Spring の部品 | 何か |
|---|---|
| DI コンテナ (Spring Core) | 全ての土台。後述 |
| Spring Boot Actuator | ヘルスチェック・メトリクス・環境情報のエンドポイントを自動生成 |
| 静的型 + コンパイル | 型が合わなければ起動する前に落ちる |
| Gradle / Maven | 依存管理 + ビルド。Bundler より守備範囲が広い |

---

## Rails にない核: DI コンテナ

Spring を理解する上で最重要。Rails では `User.find(1)` のようにクラスを直接呼ぶが、Spring では**オブジェクトの生成と結線をコンテナに任せる**。

```java
@Service // このクラスを Bean としてコンテナに登録する
public class UserService {
    private final UserRepository repository;

    // コンテナが UserRepository の実体を探して注入してくれる
    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public User find(Long id) {
        return repository.findById(id).orElseThrow();
    }
}
```

- **Bean**: コンテナが管理するオブジェクト。`@Component` / `@Service` / `@Repository` / `@Controller` を付けると登録される（全て `@Component` の別名で、役割を示すラベル）。
- **DI (依存性注入)**: コンストラクタの引数を見て、コンテナが対応する Bean を自動で渡す。
- **なぜ嬉しいか**: テストで実体を差し替えられる。Rails でいう「モックしづらいグローバル」問題が構造的に起きにくい。

`@SpringBootApplication` が付いたクラスから起動すると、そのパッケージ以下を走査して Bean を全部集める（コンポーネントスキャン）。

---

## starter と自動構成

Rails の「規約」に相当するのが starter。

```groovy
// build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'      // Spring MVC + 組込 Tomcat
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa' // Spring Data JPA + Hibernate
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.flywaydb:flyway-core'
    runtimeOnly 'org.postgresql:postgresql'
}
```

starter を足すと、**クラスパスにそれがあることを検知して設定が自動で入る**（auto-configuration）。DB ドライバがあれば DataSource を、`spring-boot-starter-web` があれば Tomcat を、それぞれ勝手に組み立てる。Rails の「Gemfile に書いたら動く」に近い体験を、この仕組みで再現している。

---

## 実務でよく使う依存

「足せる依存」は無数にあるが、API サーバを書く場合は実質いつも同じ構成に落ち着く。

### ほぼ必ず入る（土台）

| 依存 | 用途 |
|---|---|
| `spring-boot-starter-web` | REST API / Spring MVC + 組込 Tomcat |
| `spring-boot-starter-data-jpa` | ORM |
| `spring-boot-starter-validation` | Bean Validation |
| `spring-boot-starter-actuator` | ヘルスチェック・メトリクス。k8s の liveness/readiness に使うので本番なら入れる |
| `spring-boot-starter-test` | JUnit 5 + Mockito + AssertJ。Initializr がデフォルトで入れる |
| Flyway | マイグレーション |
| DB ドライバ (`postgresql` 等) | |

### 要件次第で入る

- **`spring-boot-starter-security`**: 認証があるなら。JWT を使うなら `spring-boot-starter-oauth2-resource-server` も。**Devise のような「載せれば動く」ものではない**ので、入れた時点で `SecurityFilterChain` を書く作業が発生する。
- **Lombok**: starter ではないが実質デファクト。`@Getter` などでボイラープレートを削減する。ただし `record` で足りる場面では不要になりつつある。
- **springdoc-openapi**: アノテーションから Swagger UI を自動生成。rswag 的な立ち位置。
- **Testcontainers**: 実 DB をコンテナで立てて統合テストする。

### 意外と使わない

- **Thymeleaf**: フロントを React 等で分ける構成が主流なので、出番がないことが多い。Rails の ERB の感覚で「View だから当然要る」と入れると持て余す。
- Java Mail Sender / WebSocket: 要件があるときだけ。

### JPA か MyBatis か

日本の実務では **Spring Data JPA より MyBatis（や Doma）が選ばれることも多い**。JPA は「オブジェクトに寄せて SQL を隠す」思想なので、SQL を自分で書いて握りたい現場では MyBatis に倒す。Active Record に慣れていると JPA の方が感覚は近いが、案件によっては MyBatis 前提のことがある。

---

## レイヤ構成の対比

| Rails | Spring |
|---|---|
| `app/controllers` | `@RestController` / `@Controller` |
| （なし。Model か Service Object） | `@Service` — ビジネスロジックの標準的な置き場所 |
| `app/models`（AR = 永続化 + ロジック） | `@Entity`（永続化のみ）+ `Repository`（クエリ） |

Rails の Active Record はテーブル行の表現とクエリ発行とビジネスロジックを1クラスで兼ねるが、Spring はここを **Entity / Repository / Service に分割する**のがデフォルト。ここが一番の思想差。

### コード例

```java
// Entity: テーブル行の表現だけ。クエリメソッドは持たない
@Entity
public class User {
    @Id @GeneratedValue
    private Long id;

    @NotBlank                 // Bean Validation
    @Email
    private String email;

    @OneToMany(mappedBy = "user")  // has_many :posts
    private List<Post> posts;
}

// Repository: インタフェースを宣言するだけで実装が生成される
public interface UserRepository extends JpaRepository<User, Long> {
    // メソッド名から SQL が組み立てられる (User.where(email: ...).first 相当)
    Optional<User> findByEmail(String email);
}

// Controller
@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/{id}")  // routes.rb の代わりにアノテーションでルーティング
    public User show(@PathVariable Long id) {
        return service.find(id);
    }

    @PostMapping
    public User create(@Valid @RequestBody UserForm form) {  // @Valid でバリデーション実行
        return service.create(form);
    }
}
```

`routes.rb` のような**ルーティングの一覧ファイルは存在しない**。各コントローラのアノテーションに散らばる。

---

## 設定ファイル

`config/environments/*.rb` に相当するのが Spring Profiles。依存なしで使える。

```yaml
# application.yml（共通）
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/app

---
# application-dev.yml（dev プロファイル時に上書き）
spring:
  jpa:
    show-sql: true
```

```bash
java -jar app.jar --spring.profiles.active=dev   # RAILS_ENV=development 相当
```

---

## コマンド対応

| Rails | Spring Boot |
|---|---|
| `rails new` | Spring Initializr (https://start.spring.io) |
| `bundle install` | `./gradlew build`（依存解決はビルドに内包） |
| `rails s` | `./gradlew bootRun` |
| `rails db:migrate` | `./gradlew flywayMigrate`（or 起動時に自動適用） |
| `rails c` | 相当なし（JShell / Spring Shell / テストコードで代用） |
| `rails g scaffold` | 相当なし（手で書く） |
| `rspec` | `./gradlew test`（JUnit 5） |

---

## つまづきやすいポイント

- **「対応なし」の欄は本当に無い。** Active Job / Active Storage / console / scaffold は Rails の強みであって、Spring では自分で組む（あるいは別ライブラリを探す）前提。
- **Spring Security は Devise ではない。** 認証フローを自分で組み立てる部品集。デフォルトで全エンドポイントに Basic 認証がかかるので、まず `SecurityFilterChain` を書くことになる。
- **N+1 は JPA でも起きる。** `includes` 相当は `@EntityGraph` や `join fetch`。デフォルトは遅延ロード。
- **マイグレーションは本体機能ではない。** Flyway を入れない場合、`spring.jpa.hibernate.ddl-auto` でスキーマ自動生成もできるが、本番では非推奨。

---

## どう捉えるか

Rails が「レールに乗る」なら、Spring Boot は「**レールを starter で敷いてから乗る**」。核（DI + Profiles + Actuator）だけは最初からあり、それ以外は選択。Rails で無意識に使っていた機能ほど、Spring では「これは何の依存が提供しているのか」を意識することになる。

## 参考

- [Spring Boot 4.1.0 available now](https://spring.io/blog/2026/06/10/spring-boot-4/)
- [Spring Boot | endoflife.date](https://endoflife.date/spring-boot)
