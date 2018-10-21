package com.capco.spa.service;

import com.capco.spa.jpa.entity.PortfolioLabel;
import com.capco.spa.service.exception.SPAInternalApplicationException;
import com.capco.spa.service.matlab.data.PortfolioOptimizationOutput;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.nd4j.linalg.factory.Nd4j;
import org.ojalgo.array.DenseArray;
import org.ojalgo.array.Primitive64Array;
import org.ojalgo.function.PrimitiveFunction;
import org.ojalgo.matrix.BasicMatrix;
import org.ojalgo.matrix.PrimitiveMatrix;
import org.ojalgo.matrix.store.ElementsSupplier;
import org.ojalgo.matrix.store.MatrixStore;
import org.ojalgo.matrix.store.PhysicalStore;
import org.ojalgo.matrix.store.PrimitiveDenseStore;
import org.ojalgo.optimisation.Expression;
import org.ojalgo.optimisation.ExpressionsBasedModel;
import org.ojalgo.optimisation.Optimisation;
import org.ojalgo.optimisation.Variable;
import org.ojalgo.optimisation.convex.ConvexSolver;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Random;

/**
 * Class encapsulates simple java calculations using math library ojAlgo.
 *
 * Created by Stefan Linner on 27. 7. 2017.
 */
@Slf4j
@Component
public class JavaCalculations {

    private final PhysicalStore.Factory<Double,PrimitiveDenseStore> storeFactory = PrimitiveDenseStore.FACTORY;
    private final BasicMatrix.Factory<PrimitiveMatrix> matrixFactory = PrimitiveMatrix.FACTORY;
    private final DenseArray.Factory<Double> primitive64Factory = Primitive64Array.FACTORY;

    public double[] rfContributionToRisk( double[][] rfCovarianceMat, double[] rfP1Vec, double[] weights,
                                          double[][] sensitivity, double totalNav ){

        final PrimitiveDenseStore sensitivityMat = storeFactory.rows( sensitivity );
        final PrimitiveDenseStore weightsVec = storeFactory.rows( weights );   // column vector

        double[] rfVectP4 = sensitivityMat.multiply( weightsVec ).multiply( totalNav ).toRawCopy1D();

        return rfContributionToRisk( rfCovarianceMat, rfP1Vec, rfVectP4 );
    }

    public double[][] calcRfCovarianceMatrixUDef( double[] rfVolatilityVec, double[][] rfCorrelationMat) {

        final PrimitiveDenseStore rfCorrelationMatStore = storeFactory.rows( rfCorrelationMat );
        final PrimitiveDenseStore rfVolatilityVecStore = storeFactory.rows( makeDiagonalMatrix( rfVolatilityVec) );

        return rfVolatilityVecStore.multiply( rfCorrelationMatStore ).multiply( rfVolatilityVecStore ).toRawCopy2D();
    }

    /**
     * netExpo=rfVectP4+rfVectP1;
     *
     * @param rfCovarianceMat
     * @param rfP1Vec
     * @param rfP4Vec
     * @return netExpo.*(rfCovMat*netExpo) / ((netExpo'*rfCovMat*netExpo)^0.5);
     */
    private double[] rfContributionToRisk( double[][] rfCovarianceMat, double[] rfP1Vec, double[] rfP4Vec ){
        log.debug("rfContributionToRisk() start input");

        // prepare inputs
        final PrimitiveDenseStore rfCovariance = storeFactory.rows( rfCovarianceMat );
        final PrimitiveDenseStore rfP1 = storeFactory.columns( rfP1Vec );   // row vector
        final PrimitiveDenseStore rfP4 = storeFactory.columns( rfP4Vec );   // row vector

        // calculate
        log.debug("rfContributionToRisk() start calc");

        final MatrixStore<Double> netExpo = rfP1.add( rfP4 );   // row vector
        final MatrixStore<Double> netExpoRfCov = rfCovariance.multiply( netExpo );    // row vector

        // when operand isn't just a scalar, operateOnMatching ensures we operate only on the matching elements ([2][3] * [2][3]), if dimensions don't agree
        final MatrixStore<Double> dividend = netExpoRfCov.operateOnMatching( PrimitiveFunction.MULTIPLY, netExpo ).get();
        final double scalar = netExpo.transpose().multiply( netExpoRfCov ).toScalar( 0,0 ).doubleValue();
        final double pow = Math.pow( scalar, 0.5 );
        final double divisorFlipped = 1 / pow;

        double[] result  = dividend.multiply( divisorFlipped ).get().toRawCopy1D();

        log.debug("rfContributionToRisk() end");
        return result;
    }

    public double portfolioTrackingError(double[] weightsP4, double[] weightsP1, double[][] covMatAc){
        final PrimitiveDenseStore wP4 = storeFactory.rows( weightsP4 );
        final PrimitiveDenseStore wP1 = storeFactory.rows( weightsP1 );
        final PrimitiveDenseStore cov = storeFactory.columns( covMatAc );

        MatrixStore<Double> wDiff = wP4.subtract( wP1 );
        MatrixStore<Double> covNorm = cov.add( cov.transpose() ).multiply( 0.5 );

        ElementsSupplier<Double> supplier =
                wDiff.multiply( covNorm ).multiply( wDiff.transpose() )
                        .operateOnAll( PrimitiveFunction.POW.second( 0.5 ) );

        return supplier.get().toScalar( 0,0 ).doubleValue();
    }

    public double portfolioReturn(double[] weightsP4, double[] weightsP1, double[] returns){
        final PrimitiveDenseStore wP4 = storeFactory.rows( weightsP4 );
        final PrimitiveDenseStore wP1 = storeFactory.rows( weightsP1 );
        final PrimitiveDenseStore ret = storeFactory.columns( returns );

        MatrixStore<Double> result = wP4.subtract( wP1 ).multiply( ret );
        return result.toScalar( 0,0 ).doubleValue();
    }

    public double multiplyVectorByVector( double[] vector1, double[] vector2 ){
        final PrimitiveDenseStore mat1 = storeFactory.rows( vector1 );
        final PrimitiveDenseStore mat2 = storeFactory.columns( vector2 );

        MatrixStore<Double> result = mat1.multiply( mat2 );

        if ( ! result.isScalar() ){
            throw new IllegalStateException( "Multiply vector by vector - result not a scalar!" );
        }

        return result.toScalar( 0,0 ).doubleValue();
    }

    private double[][] makeDiagonalMatrix(double[] vector) {
        int nAc = vector.length;
        double[][] diagonalMatrix = new double[nAc][];
        for ( int row = 0; row < nAc; row++){
            diagonalMatrix[ row ] = new double[nAc];
            for ( int column = 0; column < nAc; column++ ){
                if ( column == row ){
                    diagonalMatrix[row][column] = vector[ row ];
                }
            }
        }

        return diagonalMatrix;
    }

    double[][] returnsRandom;
    {
        int assets = 58;
        int observations = 1000;
        returnsRandom = new double[assets][];
        Random random = new Random();
        for (int i = 0; i < assets; i++) {
            double[] returns = new double[observations];
            double assetCoef = random.nextDouble() + 1;
            for (int j = 0; j < observations; j++) {
                returns[j] = (random.nextGaussian() + 0.05) * assetCoef;
            }
            returnsRandom[i] = returns;
        }
    }

    public PortfolioOptimizationOutput portfolioOptimization( double[][] acReturns,
                                                              double[][] allocConstraintIneqCoefMat,
                                                              double[] allocConstraintIneqConstVec ) {

        if ( true ) {
            throw new SPAInternalApplicationException("Portfolio optimization implementation " +
                    "will be finished as a part of the workshop");
        }

        int nAssets = returnsRandom.length;
        int nPortfolios = PortfolioLabel.values().length - 2;

        double[] meanReturns = new double[0];
        double[][] cov = new double[0][];
        double[] f = new double[0];
        double[][] A = new double[0][];
        double[] b = new double[0];
        double[][] Aeq = new double[0][];
        double[] beq = new double[0];

        double[] efReturns = new double[nPortfolios];
        double[][] efPortfolios = new double[nPortfolios][];
        double[] efRisks = new double[nPortfolios];

        // Min Risk Portfolio
        double[] weightsMinRisk = this.solveConvex( cov, f, A, b, Aeq, beq );
        double returnMinRisk = portfolioReturn(meanReturns, weightsMinRisk);
        efReturns[0] = returnMinRisk;
        efPortfolios[0] = weightsMinRisk;
        efRisks[0] = portfolioRisk(cov, weightsMinRisk);

        // Max Return Portfolio
        double[] weightsMaxReturn = this.solveLinear( meanReturns, A, b, Aeq, beq );
        double returnMax = portfolioReturn(meanReturns, weightsMaxReturn);
        efReturns[ nPortfolios - 1 ] = returnMax;
        efPortfolios[ nPortfolios - 1 ] = weightsMaxReturn;
        efRisks[ nPortfolios - 1 ] = portfolioRisk(cov, weightsMaxReturn);

        // Efficient Portfolios

        // set intermediate efReturns ...

        // call solveConvex() 'nPortfolios - 2' times for every intermediate efReturn,
        // with additional equality constraint with meanReturns as coefficients and efReturn as a constant


        PortfolioOptimizationOutput output = new PortfolioOptimizationOutput();
        output.setEfficientPortfoliosMat( efPortfolios );
        output.setEfficientsReturnsVec( efReturns );
        output.setTrackingErrorsVec( efRisks );

        return output;
    }


    private double[][] concatRows(double[][] top, double[] bottom) {
        return Nd4j.concat(0, Nd4j.create(top), Nd4j.create(bottom) ).toDoubleMatrix();
    }

    private double portfolioReturn(double[] meanReturns, double[] weights) {
        throw new SPAInternalApplicationException("Portfolio return formula is missing");
    }

    private double portfolioRisk(double[][] cov, double[] weights) {
        throw new SPAInternalApplicationException("Portfolio risk formula is missing");

    }

    private double[] meanRow( double[][] matrix ){
        double[] mean = new double[matrix.length];
        DescriptiveStatistics stats = new DescriptiveStatistics();
        for ( int i = 0; i < matrix.length; i++) {
            Arrays.stream( matrix[i] ).forEach(stats::addValue);
            mean[i] = stats.getMean();
        }
        return mean;
    }


    private double[] solveLinear(final double[] coefs,
                                 final double[][] A, final double[] b,
                                 final double[][] Aeq, final double[] beq){
        final int nVars = coefs.length;

        final Variable[] tmpReturns = new Variable[nVars];

        for (int i = 0; i < coefs.length; i++) {
            double ret = coefs[i];
            // return is negated, because we want to maximize
            tmpReturns[i] = ( Variable.make("Coefficient" + i).lower(0).weight( -ret ) );
        }

        final ExpressionsBasedModel tmpModel = new ExpressionsBasedModel();
        tmpModel.addVariables( tmpReturns );

        for (int i = 0; i < b.length; i++) {
            Expression expression = tmpModel.addExpression("Ineq"+i).upper( b[i] );
            for (int j = 0; j < A[i].length; j++) {
                expression.set( j, A[i][j] );
            }
        }

        for (int i = 0; i < beq.length; i++) {
            Expression expression = tmpModel.addExpression("Eq"+i).upper( beq[i] );
            for (int j = 0; j < Aeq[i].length; j++) {
                expression.set( j, Aeq[i][j] );
            }
        }

        Optimisation.Result tmpResult = tmpModel.minimise();

        return tmpResult.toRawCopy1D();

    }

    private double[] solveConvex(final double[][] H_d, final double[] f_d,
                                 double[][] A_d, double[] b_d,
                                 final double[][] Aeq_d, final double[] beq_d){

        MatrixStore<Double> H = storeFactory.rows( H_d );
        MatrixStore<Double> f = storeFactory.columns( f_d );
        MatrixStore<Double> Aeq = storeFactory.rows( Aeq_d );
        MatrixStore<Double> beq = storeFactory.columns( beq_d );


        ConvexSolver.Builder qpBlder = new ConvexSolver.Builder(H, f);  //first the basics

        if (A_d != null && A_d.length > 0
                && b_d != null && b_d.length > 0){	//the inequality bounds
            MatrixStore<Double> A = storeFactory.rows( A_d );
            MatrixStore<Double> b = storeFactory.columns( b_d );

            qpBlder.inequalities(A, b);
        }

        if (Aeq != null && beq != null){	//the equality bounds
            qpBlder.equalities(Aeq, beq);
        }

        Optimisation.Options options = new Optimisation.Options();
        /*options.iterations_abort = 50_000_000;
        options.iterations_suffice = 50_000_000;
        options.time_abort = CalendarDateUnit.MINUTE.size();
        options.time_suffice = CalendarDateUnit.MINUTE.size();
        options.mip_gap = 1.0E-8;
        options.integer = new NumberContext(13, 8, RoundingMode.HALF_EVEN);
        options.objective = new NumberContext(13, 9, RoundingMode.HALF_EVEN);
        options.print = NumberContext.getGeneral(9, 11);
        options.problem = new NumberContext(13, 9, RoundingMode.HALF_EVEN);
        options.slack = new NumberContext(11, 9, RoundingMode.HALF_DOWN);
        options.solution = new NumberContext(13, 15, RoundingMode.HALF_DOWN);*/
        options.validate = true;

        ConvexSolver qpSolver = qpBlder.build(options);


        Optimisation.Result result = qpSolver.solve();
        double[] retVal = result.toRawCopy1D();

        log.debug("optimization result {}", result);
        log.debug("optimized weights {}", retVal);

        return retVal;
    }

    public double[] columnAverage(double[][] parentAllAssetsReturns) {
        int max = 0;
        for (int i = 0; i < parentAllAssetsReturns.length; i++) {
            max = parentAllAssetsReturns[i].length > max ? parentAllAssetsReturns[i].length : max;
        }

        double[] mean = new double[max];
        DescriptiveStatistics stats = new DescriptiveStatistics();
        for (int i = 0; i < max; i++) {
            for (int j = 0; j < parentAllAssetsReturns.length; j++) {
                if (parentAllAssetsReturns[j].length > i) {
                    stats.addValue(Double.isNaN(parentAllAssetsReturns[j][i]) ? 0 : parentAllAssetsReturns[j][i]);
                }
            }
            mean[i] = stats.getMean();
        }
        return mean;
    }

}
