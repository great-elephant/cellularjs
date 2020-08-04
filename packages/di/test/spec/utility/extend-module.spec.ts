import "mocha";
import { expect } from "chai";
import { Container, Module, DiErrorCode } from "../../../src";
import { AuthModule } from "../../fixture/auth/auth.module";
import { Verify } from "../../fixture/auth/events/verify";
import { JwtModule } from "../../fixture/pkg/jwt/jwt.module";
import { JwtService } from "../../fixture/pkg/jwt/jwt.service";
import { JwtSignService } from "../../fixture/pkg/jwt/jwt-sign.service";
import { MongoModule } from "../../fixture/pkg/mongo/mongo.module";
import { MongoService } from "../../fixture/pkg/mongo/mongo.service";
import { Connection } from "../../fixture/pkg/mongo/connection";

describe("Utility - extend module: extend, override module", () => {
  let container: Container;

  beforeEach(() => {
    // clean static _ModuleMap
    (Container as any)._ModuleMap = new Map();

    container = new Container();
  });

  it("can inherit all providers from parent module", () => {
    container.addModule({
      extModule: JwtModule,
    });

    const jwtService = container.resolve<JwtService>(JwtService);

    jwtService.md5Hash("run without crash");
  });

  it("can add more provider without affect parent module", () => {
    // can add more provider ...
    container.addModule(MongoModule.config({
      mongoUrl: "neverland", user: "guest", password: "********"
    }));

    const mongoService = container.resolve<MongoService>(MongoService);
    const conn = mongoService.connection;

    expect(conn.mongoUrl).to.equal("neverland");
    expect(conn.mongoUsr).to.equal("guest");
    expect(conn.mongoPwd).to.equal("********");

    // without affecting parent module
    const newContaier = new Container();
    newContaier.addModule(MongoModule);

    try {
      newContaier.resolve(MongoService);
      expect(true).to.false;

    } catch (err) {
      expect(err.code).to.equal(DiErrorCode.NoProviderForToken);
    }
  });

  it("can override provider from parent module", () => {
    container.addModule({
      extModule: MongoModule,
      providers: [
        { token: Connection, useValue: "new value" },
      ],
    });

    const mongoService = container.resolve<MongoService>(MongoService);

    expect(mongoService.connection).to.equal("new value");
  });

  it("can inherit all imports config from parent module", async () => {
    container.addModule({
      extModule: AuthModule,
    });

    const verifyHandler = container.resolve<Verify>(Verify);

    expect(await verifyHandler.handle()).to.true;
  });

  it("can add more module to imports config", () => {
    // container have extend module can resolve JwtSignService
    const containerHaveCustomHash = new Container();
    containerHaveCustomHash.addModule(JwtModule.withSignService());

    const jwtSignService = containerHaveCustomHash.resolve<JwtSignService>(JwtSignService);
    jwtSignService.sign("run without crash");

    // container have no extend module can not resolve JwtSignService
    const containerHaveNoCustomHash = new Container();
    containerHaveNoCustomHash.addModule(JwtModule);

    try {
      containerHaveNoCustomHash.resolve(JwtSignService);
      expect(false).to.true;
    } catch (err) {
      expect(err.code).to.equal(DiErrorCode.NoProviderForToken);
    }
  });

  it("can inherit all exports config from parent module", () => {
    container.addModule({
      extModule: JwtModule,
    });

    const jwtService = container.resolve(JwtService);

    expect(jwtService).to.instanceOf(JwtService);
  });

  it("can add more module to exports config", () => {
    @Module({})
    class DummyModule { }

    container.addModule({
      extModule: DummyModule,
      exports: [JwtModule],
    });

    const jwtService = container.resolve(JwtService);

    expect(jwtService).to.instanceOf(JwtService);
  });

  it("can add more service to exports config", () => {
    @Module({})
    class DummyModule { }

    class DummyService {
      run() {
        return "run DummyService";
      }
    }

    container.addModule({
      extModule: DummyModule,
      exports: [DummyService],
    });

    const dummyService = container.resolve<DummyService>(DummyService);

    expect(dummyService.run()).to.equal("run DummyService");
  });
});